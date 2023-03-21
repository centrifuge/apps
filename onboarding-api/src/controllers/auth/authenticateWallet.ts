import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { SiweMessage } from 'siwe'
import { InferType, object, string } from 'yup'
import { centrifuge } from '../../utils/centrifuge'
import { reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

const verifyWalletInput = object({
  message: object({
    nonce: string(),
    domain: string(),
    uri: string(),
    statement: string(),
    address: string(),
    chainId: string(),
    version: string(),
  }),
  signature: string(),
  jw3tToken: string(),
})

export const authenticateWalletController = async (
  req: Request<{}, {}, InferType<typeof verifyWalletInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, verifyWalletInput)
    const payload = !!req.body.jw3tToken ? await verifySubstrateWallet(req) : await verifyEthWallet(req, res)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })
    return res.json({ token })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message, e })
  }
}

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']
async function verifySubstrateWallet(req: Request) {
  const token = req.body.jw3tToken
  const { verified, payload } = await centrifuge.auth.verify(token!)

  const onBehalfOf = payload?.on_behalf_of
  const address = payload.address

  if (verified && onBehalfOf) {
    const isVerifiedProxy = await centrifuge.auth.verifyProxy(address, onBehalfOf, AUTHORIZED_ONBOARDING_PROXY_TYPES)
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
    const key = req.cookies['onboarding-auth']
    const [nonce, address] = key.split('-')
    const { message, signature } = req.body
    message.nonce = nonce

    if (nonce !== message.nonce || address !== message.address) {
      throw new Error('Invalid message')
    }

    const decodedMessage = await new SiweMessage(message).verify({ signature })
    return {
      address: decodedMessage.data.address,
      network: 'evm',
    }
  } catch (error) {
    throw new Error('Invalid message or signature')
  } finally {
    res.clearCookie('onboarding-auth')
  }
}
