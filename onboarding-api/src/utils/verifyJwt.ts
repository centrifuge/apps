import * as jwt from 'jsonwebtoken'
import { HttpError } from './httpError'

export const verifyJwt = <T extends any>(token: string) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, (error, data) => {
    if (error) {
      console.log('Bad jwt verification', JSON.stringify(error))
      throw new HttpError(400, 'Bad request')
    }
    return data
  }) as T
  return payload
}
