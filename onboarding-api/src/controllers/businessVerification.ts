import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v1/https'
import * as jwt from 'jsonwebtoken'
import { bool, date, InferType, object, string } from 'yup'
import { businessCollection, validateAndWriteToFirestore } from '../database'
import { checkHttpMethod } from '../utils/httpMethods'
import { shuftiProRequest } from '../utils/shuftiProRequest'
import { validateInput } from '../utils/validateInput'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessVerificationInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests and returns a failed event
  email: string().email().required(),
  address: string().required(),
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  businessIncorporationDate: date().required(), // used for AML
  companyRegistrationNumber: string().required(),
  companyJurisdictionCode: string().required(), // country of incorporation
})

export const businessVerificationController = async (
  req: Request<any, any, InferType<typeof businessVerificationInput>>,
  res: Response
) => {
  let shuftiErrors: string[] = []
  try {
    checkHttpMethod(req, 'POST')

    const { address } = await verifyJw3t(req)
    await validateInput(req, businessVerificationInput)

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
      ultimateBeneficialOwners: businessAML?.verification_data?.kyb?.company_ultimate_beneficial_owners || [],
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

    await validateAndWriteToFirestore(address, business, 'BUSINESS')

    // only set cookie if businessAML and KYB were successful
    if (shuftiErrors.length === 0) {
      const expiresIn = 1000 * 60 * 15 // 15 minutes
      const token = jwt.sign({ address }, process.env.JWT_SECRET as string, { expiresIn })
      res.cookie('__session', token, {
        secure: true,
        httpOnly: true,
        maxAge: expiresIn,
        path: 'centrifuge-fargate-apps-dev/us-central1', // TODO: make dynamic
        sameSite: 'none',
      })
    }

    res.json({
      errors: shuftiErrors,
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
