import * as crypto from 'crypto'
import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/https'
import { date, InferType, object, string } from 'yup'
import { businessCollection, validateAndWriteToFirestore } from '../database'
import { shuftiProRequest } from '../utils/shuftiProRequest'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessVerificationInput = object({
  email: string().email().required(),
  address: string().required(), // make sure address matches address in payload
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  businessIncorporationDate: date(), // used for AML
  companyRegistrationNumber: string().required(),
  companyJurisdictionCode: string().required(), // country of incorporation
})

export const businessVerificationController = async (
  req: Request<any, any, InferType<typeof businessVerificationInput>>,
  res: Response
) => {
  try {
    const dryRun = req.query?.dryRun // dry run skips shuftipro requests and returns a mocked response
    if (req.method !== 'POST') {
      throw new HttpsError('permission-denied', 'Method not allowed')
    }
    const { address } = await verifyJw3t(req)
    await businessVerificationInput.validate(req.body)

    const {
      body: {
        businessIncorporationDate,
        companyJurisdictionCode,
        companyRegistrationNumber,
        businessName,
        trancheId,
        poolId,
        email,
      },
    } = { ...req }

    const userDoc = await businessCollection.doc(address).get()
    if (userDoc.exists && userDoc.data()?.steps?.businessVerification?.verified) {
      throw new Error('Business already verified')
    }

    // send email verfication link

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
        business_incorporation_date: businessIncorporationDate,
      },
    }
    const businessAML = !dryRun ? await shuftiProRequest(req, payloadAML) : { event: 'failed' }
    console.log('🚀 ~ businessAML', businessAML)
    const businessAmlVerified = businessAML.event === 'verification.accepted'
    // const businessAmlVerified = false

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_jurisdiction_code: companyJurisdictionCode,
        company_registration_number: companyRegistrationNumber,
      },
    }

    if (!businessAmlVerified) {
      functions.logger.warn('KYB failed')
    }

    const kyb = !dryRun ? await shuftiProRequest(req, kybPayload) : { event: 'failed' }
    const kybVerified = kyb.event === 'verification.accepted'
    // const kybVerified = false
    if (!kybVerified) {
      functions.logger.warn('KYB failed')
    }

    const uboVerificationCode = crypto.randomBytes(27).toString('hex')

    const business = {
      lastUpdated: new Date(),
      address,
      email,
      businessName,
      trancheId,
      poolId,
      steps: {
        email: {
          verificationCode: businessAmlVerified && kybVerified ? uboVerificationCode : '',
          verified: false,
        },
        kyb: {
          verificationCode: uboVerificationCode,
          verified: false,
        },
        kyc: {
          verified: false,
          users: [],
        },
      },
    }

    await validateAndWriteToFirestore(address, business, 'BUSINESS')

    // await firestore().collection('shuftipro-kyb').doc('kyb').set(kyb)
    // await firestore().collection('shuftipro-business-aml').doc('aml').set(businessAML)

    // add business owners to response
    res.json({
      ultimateBeneficialOwners: [],
      kyb,
      businessAML,
      ...business,
    })
  } catch (error) {
    if (error instanceof HttpsError) {
      functions.logger.log(error.message)
      res.status(error.httpErrorCode.status).send(error.message)
    } else {
      res.status(500).send('An unexpected error occured')
    }
  }
}
