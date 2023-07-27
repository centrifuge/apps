import { isAddress } from '@ethersproject/address'
import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { HttpError } from '../utils/httpError'
import { getValidSubstrateAddress } from '../utils/networks/centrifuge'

export const verifyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers
  if (!authorization) {
    throw new HttpError(401, 'Unauthorized')
  }
  const token = authorization.split(' ')[1]
  const { address, network, aud } = (await jwt.verify(token, process.env.JWT_SECRET)) as Request['wallet'] &
    jwt.JwtPayload
  if (!address) {
    throw new HttpError(401, 'Unauthorized')
  }
  if (aud !== req.get('origin')) {
    throw new HttpError(401, 'Unauthorized')
  }
  if (
    (network.includes('evm') && !isAddress(address)) ||
    (network === 'substrate' && !(await getValidSubstrateAddress({ address, network })))
  ) {
    throw new HttpError(401, 'Invalid address')
  }
  req.wallet = { address, network }
  next()
}
