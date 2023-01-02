import { Request } from 'firebase-functions/v1'
import { HttpsError } from 'firebase-functions/v1/https'

export const checkHttpMethod = (req: Request, method: 'POST' | 'GET') => {
  if (req.method !== method) {
    throw new HttpsError('not-found', 'Method not allowed')
  }
}
