import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { InferType, object, string } from 'yup'
import { reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const kybInput = object({
  email: string().email(),
  jurisdictionCode: string().required(),
})

export const startKYBController = async (req: Request<any, any, InferType<typeof kybInput>>, res: Response) => {
  try {
    const { body, wallet } = req
    await validateInput(body, kybInput)

    // todo: add checks for required params and throw http errors accordingly

    const kybReference = `KYB_${Math.random()}`
    console.log('------ kybReference -------', kybReference)

    const token = jwt.sign({ kybReference }, process.env.JWT_SECRET, {
      expiresIn: '30d',
      algorithm: 'none',
    })
    console.log('token', token)

    const payloadKYB = {
      manual_review: 1,
      enable_extra_proofs: 1,
      labels: [
        'articles_of_association',
        // 'certificate_of_incorporation',
        // 'proof_of_address',
        // 'register_of_directors',
        // 'register_of_shareholders',
        // 'signed_and_dated_ownership_structure',
      ],
      verification_mode: 'any',
      reference: kybReference,
      email: body.email,
      country: body.jurisdictionCode,

      // https://ra.shuftipro.com/questionnaire-docs/request
      // callback_url: 'https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-pr1297/kyb-callback',
      callback_url: `https://seven-moose-return-85-149-106-77.loca.lt/kyb-callback?token=${token}`,
      redirect_url: 'http://localhost:3000/onboarding/redirect-url',
    }

    const kyb = await shuftiProRequest(req, payloadKYB)
    return res.send({ ...kyb })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
