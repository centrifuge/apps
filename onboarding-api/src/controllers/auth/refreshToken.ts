import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { SupportedNetworks } from '../../database'
import { HttpError, reportHttpError } from '../../utils/httpError'

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
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
    const refreshedToken = jwt.sign({ address: payload.address, network: payload.network }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })
    return res.send({ token: refreshedToken })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error })
  }
}
