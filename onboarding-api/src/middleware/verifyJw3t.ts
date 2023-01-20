import { NextFunction, Request, Response } from 'express'
import * as jw3t from 'jw3t'
import { HttpsError } from '../utils/httpsError'

export async function verifyJw3t(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || ''
    const polkaJsVerifier = new jw3t.PolkaJsVerifier()
    const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)

    const { payload } = await verifier.verify(token)

    req.walletAddress = payload.address
    next()
  } catch {
    throw new HttpsError(401, 'Invalid token')
  }
}
