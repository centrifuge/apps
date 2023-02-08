import * as jwt from 'jsonwebtoken'
import { HttpsError } from './httpsError'

export const verifyJwt = <T extends any>(token: string) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
    if (error) {
      throw new HttpsError(400, 'Bad request')
    }
    return data
  }) as T
  return payload
}
