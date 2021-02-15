import { JwtUtils } from '@connectedcars/jwtutils'
import { Injectable } from '@nestjs/common'
import config from '../config'

export const SessionCookieName = 'Onboard-API-Session'

@Injectable()
export class SessionService {
  pubKeys = {
    'https://jwt.io/': {
      '1@RS256': config.sessions.publicKey.replace(/\\n/g, '\n'),
      'default@RS256': config.sessions.publicKey.replace(/\\n/g, '\n'),
    },
  }

  create(userId: string): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const unixNow = Math.floor(Date.now() / 1000)
    const oneHour = 60 * 60

    const body: SessionPayload = {
      sub: userId,
      aud: config.onboardApiHost,
      iss: 'https://jwt.io/',
      iat: unixNow,
      exp: unixNow + oneHour,
    }

    const privateKey = config.sessions.privateKey.replace(/\\n/g, '\n')
    const jwt = JwtUtils.encode(privateKey, header, body, config.sessions.privateKeyPassword)

    return jwt
  }

  verify(session: string): SessionPayload | undefined {
    try {
      return JwtUtils.decode(session, this.pubKeys, [config.onboardApiHost])
    } catch (e) {
      console.error(e)
      return undefined
    }
  }
}

export interface SessionPayload {
  sub: string
  aud: string
  iss: string
  iat: number
  exp: number
}
