import * as crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { ManualKybCallbackRequestBody } from '../controllers/kyb/manualKybCallback'

const isValidShuftiProRequest = (body: ManualKybCallbackRequestBody, signature: string | string[]) => {
  const requestBody = JSON.stringify(body)
    //  escape all `/`
    .replace(/\//g, '\\/')

    // replace greek characters with unicodes
    .replace(/\u00f4/g, '\\u00f4')
    .replace(/\u00fa/g, '\\u00fa')
    .replace(/\u039a/g, '\\u039a')
    .replace(/\u039d/g, '\\u039d')
    .replace(/\u03a4/g, '\\u03a4')
    .replace(/\u0399/g, '\\u0399')

  const hash = crypto.createHash('sha256').update(`${requestBody}${process.env.SHUFTI_PRO_SECRET_KEY}`).digest('hex')

  return hash === signature
}

export const shuftiProAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { body, headers } = req

  if (headers.origin === undefined && headers.signature) {
    const isValid = isValidShuftiProRequest(body, headers.signature)

    if (isValid) {
      headers.origin = 'https://shuftipro.com'
    } else {
      throw new Error('Unauthorized')
    }
  }

  next()
}
