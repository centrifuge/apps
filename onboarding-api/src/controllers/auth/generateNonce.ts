import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { reportHttpError } from '../../utils/httpError'
import { validateInput } from '../../utils/validateInput'

export type NonceCookiePayload = {
  nonce: string
  address: string
}

const centrifugeHosts = ['localhost', 'cntrfg', 'centrifuge', 'k-f']

const generateNonceInput = object({
  address: string().required(),
})

export const generateNonceController = async (
  req: Request<{}, {}, InferType<typeof generateNonceInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, generateNonceInput)
    const nonce = req.ssx.generateNonce?.()

    if (!nonce) {
      throw new Error('Could not generate nonce')
    }

    res.cookie(`onboarding-auth-${req.body.address.toLowerCase()}`, `${nonce}`, {
      secure: !(process.env.COLLATOR_WSS_URL.includes('demo') || process.env.COLLATOR_WSS_URL.includes('dev')),
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      domain: centrifugeHosts.includes(req.hostname) ? req.hostname : undefined,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12 hours
      signed: true,
    })
    return res.status(200).send({ nonce })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
