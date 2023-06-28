import { isAddress } from '@polkadot/util-crypto'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { SiweMessage } from 'siwe'
import { InferType, object, string } from 'yup'
import { getCentrifuge, isValidSubstrateAddress } from '../../utils/centrifuge'
import { reportHttpError } from '../../utils/httpError'
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
})

export const authenticateWalletController = async (
  req: Request<{}, {}, InferType<typeof verifyWalletInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, verifyWalletInput)
    const payload = req.body?.jw3t ? await verifySubstrateWallet(req, res) : await verifyEthWallet(req, res)
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
async function verifySubstrateWallet(req: Request, res: Response) {
  const { jw3t: token, nonce } = req.body
  const { verified, payload } = await await getCentrifuge().auth.verify(token!)

  const onBehalfOf = payload?.on_behalf_of
  const address = payload.address
  if (!isValidSubstrateAddress(address)) {
    throw new Error('Invalid address')
  }

  const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]
  if (!cookieNonce || cookieNonce !== nonce) {
    throw new Error('Invalid nonce')
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
    network: 'substrate',
  }
}

async function verifyEthWallet(req: Request, res: Response) {
  try {
    const { message, signature, address, nonce } = req.body

    if (!isAddress(address)) {
      throw new Error('Invalid address')
    }

    const cookieNonce = req.signedCookies[`onboarding-auth-${address.toLowerCase()}`]

    if (!cookieNonce || cookieNonce !== nonce) {
      throw new Error('Invalid nonce')
    }

    const decodedMessage = await new SiweMessage(message).verify({ signature })
    res.clearCookie(`onboarding-auth-${address.toLowerCase()}`)
    return {
      address: decodedMessage.data.address,
      network: 'evm',
    }
  } catch (error) {
    throw new Error('Invalid message or signature')
  }
}
