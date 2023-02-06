import { NextFunction, Request, Response } from 'express'
import { centrifuge } from '../utils/centrifuge'
import { HttpsError } from '../utils/httpsError'

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export async function verifyJw3t(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || ''
    const { verified, payload } = await centrifuge.auth.verify(token!)

    const onBehalfOf = payload?.on_behalf_of
    const address = payload.address

    if (verified && onBehalfOf) {
      const isVerifiedProxy = await centrifuge.auth.verifyProxy(address, onBehalfOf, AUTHORIZED_ONBOARDING_PROXY_TYPES)
      if (isVerifiedProxy.verified) {
        req.walletAddress = address
      } else if (verified && !onBehalfOf) {
        req.walletAddress = address
      } else {
        throw new Error()
      }
    }
    req.walletAddress = address
    next()
  } catch {
    throw new HttpsError(401, 'Invalid token')
  }
}
