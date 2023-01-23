import { Request } from 'express'
import fetch from 'node-fetch'
import { businessAmlMockResponse } from '../mocks/businessAmlResponse'
import { kybMockResponse } from '../mocks/kybResponse'
import { HttpsError } from './httpsError'

export const shuftiProRequest = async (_req: Request, payload: any, options?: { dryRun?: boolean; path?: string }) => {
  if (options?.dryRun) {
    if (payload.reference.startsWith('BUSINESS_AML_REQUEST')) {
      return businessAmlMockResponse
    } else if (payload.reference.startsWith('KYB_REQUEST')) {
      return kybMockResponse
    }
    return { event: 'failed', reference: payload.reference }
  }

  try {
    // TODO: check if possible to use Buf.from()
    const token = btoa(`${process.env.SHUFTI_PRO_CLIENT_ID}:${process.env.SHUFTI_PRO_SECRET_KEY}`)
    const shuftiRes = await fetch(`https://api.shuftipro.com/${options?.path ?? ''}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await shuftiRes.json()
    if (data.error) {
      console.log(data.error.message)
      throw new HttpsError(400, `${payload.reference} ${data.error.message}`)
    }
    return data
  } catch (error) {
    // @ts-expect-error error typing
    console.log(error.message, payload.reference)
    throw new HttpsError(400, `ShuftiPro request failed (reference: ${payload.reference})`)
  }
}
