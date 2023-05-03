import { isAddress } from '@polkadot/util-crypto'
import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { isValidSubstrateAddress } from '../utils/centrifuge'
import { HttpError } from '../utils/httpError'
import { SupportedNetworks } from '../utils/types'

export const verifyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers
  if (!authorization) {
    throw new HttpError(401, 'Unauthorized')
  }
  const token = authorization.split(' ')[1]
  const { address, network, aud } = (await jwt.verify(token, process.env.JWT_SECRET)) as {
    address: string
    network: SupportedNetworks
  } & jwt.JwtPayload
  if (!address) {
    throw new HttpError(401, 'Unauthorized')
  }
  if (aud !== req.get('origin')) {
    throw new HttpError(401, 'Unauthorized')
  }
  if ((network === 'evm' && !isAddress(address)) || (network === 'substrate' && !isValidSubstrateAddress(address))) {
    throw new HttpError(401, 'Invalid address')
  }
  req.wallet = { address, network }
  next()
}
