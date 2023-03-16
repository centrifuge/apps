import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { SiweMessage } from 'siwe'
import { centrifuge } from '../../utils/centrifuge'
import { reportHttpError } from '../../utils/httpError'

export const verifyWalletController = async (req: Request, res: Response) => {
  const { message } = req.body
  try {
    const jwtToken = message ? await verifyEthWallet(req) : await verifySubstrateWallet(req)
    const payload = {
      address: jwtToken,
      network: message ? 'evm' : 'substrate',
    }
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
  return address
}

async function verifyEthWallet(req: Request) {
  const { message, signature } = req.body
  const decodedMessage = await new SiweMessage(message).verify({ signature })
  return decodedMessage.data.address
}
