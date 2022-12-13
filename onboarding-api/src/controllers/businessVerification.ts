import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/https'
import { bool, date, InferType, object, string } from 'yup'
import { businessCollection, firestore, validateAndWriteToFirestore } from '../database'
import { shuftiProRequest } from '../utils/shuftiProRequest'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessVerificationInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests and returns a failed event. TODO: provide mocks
  email: string().email().required(),
  address: string().required(),
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
  let shuftiErrors: string[] = []
  try {
    if (req.method !== 'POST') {
      throw new HttpsError('internal', 'Method not allowed')
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
        dryRun,
      },
    } = { ...req }

    const userDoc = await businessCollection.doc(address).get()
    if (userDoc.exists && userDoc.data()?.steps?.kyb?.verified) {
      throw new HttpsError('invalid-argument', 'Business already verified')
    }

    // TODO: send email verfication link

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
        business_incorporation_date: businessIncorporationDate,
      },
    }
    const businessAML = await shuftiProRequest(req, payloadAML, { dryRun })
    const businessAmlVerified = businessAML.event === 'verification.accepted'
    if (!businessAmlVerified) {
      shuftiErrors = [...shuftiErrors, 'Business AML failed']
      functions.logger.warn('Business AML failed')
    }

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_jurisdiction_code: companyJurisdictionCode,
        company_registration_number: companyRegistrationNumber,
      },
    }
    const kyb = await shuftiProRequest(req, kybPayload, { dryRun })
    const kybVerified = kyb.event === 'verification.accepted'
    if (!kybVerified) {
      shuftiErrors = [...shuftiErrors, 'KYB failed']
      functions.logger.warn('KYB failed')
    }

    const business = {
      lastUpdated: new Date(),
      address,
      email,
      businessName,
      trancheId,
      poolId,
      steps: {
        email: {
          verificationCode: '',
          verified: false,
        },
        kyb: {
          verified: false,
        },
        kyc: {
          verified: false,
          users: [],
        },
      },
    }

    await Promise.all([
      validateAndWriteToFirestore(address, business, 'BUSINESS'),
      // TODO remove these after validating KYB with real data
      firestore().collection('shuftipro-kyb').doc(`kyb${Math.random()}`).set(kyb),
      firestore().collection(`shuftipro-business-aml`).doc(`aml${Math.random()}`).set(businessAML),
    ])

    // only set cookie if businessAML and KYB were successful
    if (shuftiErrors.length > 0) {
      res.cookie('__session', JSON.stringify({ address }), {
        secure: process.env.NODE_ENV !== 'development',
        httpOnly: true,
        maxAge: 1000 * 60 * 5,
        path: 'centrifuge-fargate-apps-dev/us-central1', // TODO: make dynamic
      })
    }

    res.json({
      errors: shuftiErrors,
      ultimateBeneficialOwners: businessAML?.verification_data.kyb?.company_ultimate_beneficial_owners || [],
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
