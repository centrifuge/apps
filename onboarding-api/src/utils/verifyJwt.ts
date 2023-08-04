import * as jwt from 'jsonwebtoken'
import { HttpError } from './httpError'

export const verifyJwt = <T extends any>(token: string) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
    if (error) {
      throw new HttpError(401, 'JWT verification failed')
    }
    return data
  }) as T
  return payload
}
