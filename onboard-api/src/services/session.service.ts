import { JwtUtils } from '@connectedcars/jwtutils'
import { Injectable } from '@nestjs/common'

export const SessionCookieName = 'Onboard-API-Session'

@Injectable()
export class SessionService {
  // TODO: add expiration
  create(userId: string): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const body = {
      sub: userId,
    }

    const privateKey = process.env.SESSIONS_PRIVATE_KEY.replace(/\\n/g, '\n')
    const jwt = JwtUtils.encode(privateKey, header, body, process.env.SESSIONS_PRIVATE_KEY_PASSWORD)

    return jwt
  }

  verify(session: string, userId: string): boolean {
    try {
      const decodedJwtBody = JwtUtils.decode(session, process.env.SESSIONS_PUBLIC_KEY, [])
      console.log({ decodedJwtBody })
    } catch (e) {
      console.error(e)
    }

    return true
  }
}
