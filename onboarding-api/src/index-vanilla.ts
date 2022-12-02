import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { InferType, object, string } from 'yup'
import { GcloudWrapper } from './gcloudWrapper'
import { bodyValidator } from './middleware/bodyValidator'

const businessInfoSchema = object({
  email: string().email().required(),
})

type BusinessInfoType = InferType<typeof businessInfoSchema>

const handler = async (request: Request<{}, {}, BusinessInfoType>, response: Response) => {
  functions.logger.info('Hello logs!')
  const body = request.body
  // check if wallet is authed (decrypt jw3t token)
  // send email verfication link
  return response.json({ body })
}

const businessInfoFunction = new GcloudWrapper()
businessInfoFunction.use((req, res) => bodyValidator<BusinessInfoType>(req, res, businessInfoSchema))
exports.businessInfo = businessInfoFunction.post(handler)
