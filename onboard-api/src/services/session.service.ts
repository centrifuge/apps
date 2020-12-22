import { JwtUtils } from '@connectedcars/jwtutils'
import { Injectable } from '@nestjs/common'

export const SessionCookieName = 'Onboard-API-Session'

@Injectable()
export class SessionService {
  pubKeys = {
    'https://jwt.io/': {
      '1@RS256': process.env.SESSIONS_PUBLIC_KEY.replace(/\\n/g, '\n'),
      'default@RS256': process.env.SESSIONS_PUBLIC_KEY.replace(/\\n/g, '\n'),
    },
  }

  create(userId: string): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }
    const unixNow = Math.floor(Date.now() / 1000)

    const body = {
      sub: userId,
      aud: process.env.ONBOARD_API_HOST,
      iss: 'https://jwt.io/',
      iat: unixNow,
      exp: unixNow + 600,
    }

    const privateKey = process.env.SESSIONS_PRIVATE_KEY.replace(/\\n/g, '\n')
    const jwt = JwtUtils.encode(privateKey, header, body, process.env.SESSIONS_PRIVATE_KEY_PASSWORD)

    return jwt
  }

  verify(session: string, userId: string): boolean {
    try {
      const decodedJwtBody = JwtUtils.decode(session, this.pubKeys, [process.env.ONBOARD_API_HOST])
      return decodedJwtBody.sub === userId
    } catch (e) {
      console.error(e)
      return false
    }
  }
}
