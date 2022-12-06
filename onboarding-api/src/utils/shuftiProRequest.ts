import { Request } from 'express'
import * as functions from 'firebase-functions'
import fetch from 'node-fetch'

export const shuftiProRequest = async (_req: Request, payload: any) => {
  // TODO: check if possible to use Buf.from()
  const token = btoa(`${process.env.SHUFTI_PRO_CLIENT_ID}:${process.env.SHUFTI_PRO_SECRET_KEY}`)
  const shuftiRes = await fetch('https://api.shuftipro.com/', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + token,
    },
    body: JSON.stringify(payload),
  })

  const data = await shuftiRes.json()
  if (data.error) {
    functions.logger.log(data.error.message)
  }
  return data
}
