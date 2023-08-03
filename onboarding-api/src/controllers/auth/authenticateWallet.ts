import { isAddress } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { SiweMessage } from 'siwe'
import { InferType, object, string, StringSchema } from 'yup'
import { SupportedNetworks } from '../../database'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { getCentrifuge } from '../../utils/networks/centrifuge'
import { NetworkSwitch } from '../../utils/networks/networkSwitch'
import { validateInput } from '../../utils/validateInput'

const verifyWalletInput = object({
  signature: string(),
  message: string().when('signature', {
    is: (value) => value !== undefined,
    then: (verifyWalletInput) => verifyWalletInput.required(),
  }),
  address: string().when('signature', {
    is: (value) => value !== undefined,
    then: (verifyWalletInput) =>
      verifyWalletInput.required().test({
        name: 'is-address',
        test(value, ctx) {
          if (isAddress(value)) return true
          return ctx.createError({ message: 'Invalid address', path: ctx.path })
        },
      }),
  }),
  jw3t: string().when('signature', {
    is: undefined,
    then: (verifyWalletInput) => verifyWalletInput.required(),
  }),
  nonce: string().required(),
  network: string().oneOf(['evm', 'substrate', 'evmOnSubstrate']) as StringSchema<SupportedNetworks>,
})

export const authenticateWalletController = async (
  req: Request<{}, {}, InferType<typeof verifyWalletInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, verifyWalletInput)
    const payload = await new NetworkSwitch(req.body.network).verifiyWallet(req, res)

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
      audience: req.get('origin'),
    })
    return res.json({ token })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message, e })
  }
}

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']
export async function verifySubstrateWallet(req: Request, res: Response): Promise<Request['wallet']> {
  const { jw3t: token, nonce } = req.body
  const { verified, payload } = await await getCentrifuge().auth.verify(token!)

  const onBehalfOf = payload?.on_behalf_of
  const address = payload.address

  const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]
  if (!cookieNonce || cookieNonce !== nonce) {
    throw new HttpError(400, 'Invalid nonce')
  }

  res.clearCookie(`onboarding-auth-${address.toLowerCase()}`)

  if (verified && onBehalfOf) {
    const isVerifiedProxy = await getCentrifuge().auth.verifyProxy(
      address,
      onBehalfOf,
      AUTHORIZED_ONBOARDING_PROXY_TYPES
    )
    if (isVerifiedProxy.verified) {
      req.wallet.address = address
    } else if (verified && !onBehalfOf) {
      req.wallet.address = address
    } else {
      throw new Error()
    }
  }
  return {
    address,
    network: payload.network || 'substrate',
  }
}

export async function verifyEthWallet(req: Request, res: Response): Promise<Request['wallet']> {
  const { message, signature, address, nonce, network } = req.body

  if (!isAddress(address)) {
    throw new HttpError(400, 'Invalid address')
  }

  const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]

  if (!cookieNonce || cookieNonce !== nonce) {
    throw new HttpError(400, 'Invalid nonce')
  }

  const decodedMessage = await new SiweMessage(message).verify({ signature })
  res.clearCookie(`onboarding-auth-${address.toLowerCase()}`)
  return {
    address: decodedMessage.data.address,
    network,
  }
}
