import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { HttpError } from '../utils/httpError'
import { SupportedNetworks } from '../utils/types'

export const verifyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers
  if (!authorization) {
    throw new HttpError(401, 'Unauthorized')
  }
  const token = authorization.split(' ')[1]
  const payload = (await jwt.verify(token, process.env.JWT_SECRET)) as {
    address: string
    network: SupportedNetworks
  }
  if (!payload?.address) {
    throw new HttpError(401, 'Unauthorized')
  }
  req.wallet = { address: payload.address, network: payload.network }
  next()
}
