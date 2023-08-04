import fetch from 'node-fetch'
import { businessAmlMockResponse } from '../mocks/businessAmlResponse'
import { kybMockResponse } from '../mocks/kybResponse'
import { IS_DEV_ENV } from './envCheck'
import { HttpError } from './httpError'

export const shuftiProRequest = async (payload: any, options?: { dryRun?: boolean; path?: string }) => {
  if (options?.dryRun && IS_DEV_ENV) {
    if (payload.reference.startsWith('BUSINESS_AML_REQUEST')) {
      return businessAmlMockResponse
    } else if (payload.reference.startsWith('KYB_REQUEST')) {
      return kybMockResponse
    } else if (payload.reference.startsWith('KYC')) {
      return { event: 'verification.accepted', reference: payload.reference }
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
      throw new HttpError(400, `${payload.reference} ${data.error.message}`)
    }
    return data
  } catch (error) {
    // @ts-expect-error error typing
    console.log(error.message, payload.reference)
    throw new HttpError(400, `ShuftiPro request failed (reference: ${payload.reference})`)
  }
}
