import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { HttpError, reportHttpError } from '../../utils/httpError'

export const verifyTokenController = async (req: Request, res: Response) => {
  try {
    const { authorization } = req.headers
    if (!authorization) {
      throw new HttpError(401, 'Unauthorized')
    }
    const token = authorization.split(' ')[1]
    const payload = (await jwt.verify(token, process.env.JWT_SECRET)) as Request['wallet'] & jwt.JwtPayload
    if (!payload?.address) {
      throw new HttpError(401, 'Unauthorized')
    }
    if (payload.aud !== req.get('origin')) {
      throw new HttpError(401, 'Unauthorized')
    }
    return res.send({ verified: true })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error })
  }
}
