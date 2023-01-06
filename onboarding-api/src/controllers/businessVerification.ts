import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { bool, date, InferType, object, string } from 'yup'
import { businessCollection, validateAndWriteToFirestore } from '../database'
import { HttpsError } from '../utils/httpsError'
import { shuftiProRequest } from '../utils/shuftiProRequest'
import { validateInput } from '../utils/validateInput'
import { verifyJw3t } from '../utils/verifyJw3t'

dotenv.config()

const businessVerificationInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests
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
      throw new HttpsError(400, 'Business already verified')
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
      console.warn('Business AML failed')
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
      console.warn('KYB failed')
    }

    const business = {
      lastUpdated: new Date().toISOString(),
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
        path: '/',
        sameSite: 'none',
      })
    }

    return res.status(200).json({
      errors: shuftiErrors,
      ...business,
    })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    } else {
      console.log(error)
      return res.status(500).send('An unexpected error occured')
    }
  }
}
