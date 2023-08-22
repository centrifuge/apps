import { isAddress } from '@ethersproject/address'
import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { getValidSubstrateAddress } from '../utils/networks/centrifuge'

export const verifyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers
    if (!authorization) {
      throw new Error('Unauthorized')
    }
    const token = authorization.split(' ')[1]
    const { address, network, chainId, aud } = (await jwt.verify(token, process.env.JWT_SECRET)) as Request['wallet'] &
      jwt.JwtPayload
    if (!address || aud !== req.get('origin')) {
      throw new Error('Unauthorized')
    }
    if (
      (network.includes('evm') && !isAddress(address)) ||
      (network === 'substrate' && !(await getValidSubstrateAddress({ address, network, chainId })))
    ) {
      throw new Error('Unauthorized')
    }
    req.wallet = { address, network, chainId }
    next()
  } catch (e) {
    throw new Error('Unauthorized')
  }
}
