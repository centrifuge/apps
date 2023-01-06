import { Request } from 'express'
import * as jw3t from 'jw3t'
import { HttpsError } from './httpsError'

type Jw3TPayload = {
  address: string
}

export async function verifyJw3t(request: Request) {
  try {
    const token = request.headers.authorization?.split(' ')[1] || ''
    const polkaJsVerifier = new jw3t.PolkaJsVerifier()
    const verifier = new jw3t.JW3TVerifier(polkaJsVerifier)

    const { payload } = await verifier.verify(token)

    return payload as Jw3TPayload
  } catch {
    throw new HttpsError(401, 'Invalid token')
  }
}
