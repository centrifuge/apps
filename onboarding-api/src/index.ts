import { Express, Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { InferType, object, string } from 'yup'
import { bodyValidatorExpress } from './middleware/bodyValidator'

const express = require('express')

const businessInfoSchema = object({
  email: string().email().required(),
})

type BusinessInfoType = InferType<typeof businessInfoSchema>

const handler = async (request: Request<{}, {}, BusinessInfoType>, response: Response) => {
  functions.logger.info('businessInfo running!')
  const body = request.body
  // check if wallet is authed (jw3t token)
  // send email verfication link
  return response.json({ body })
}

const businessInfo: Express = express()
businessInfo.use((req, res, next) => bodyValidatorExpress(req, res, next, businessInfoSchema))
businessInfo.post('/', handler)

exports.businessInfo = functions.https.onRequest(businessInfo)
