import { Request, Response } from 'express'
import * as functions from 'firebase-functions'
import { date, InferType, object, string } from 'yup'
import { firestore, validateAndWriteToFirestore } from '../database'
import { shuftiProRequest } from '../utils/shuftiProRequest'
import { verifyJw3t } from '../utils/verifyJw3t'

const businessInfoInput = object({
  email: string().email().required(),
  address: string().required(), // make sure address matches address in payload
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  businessIncorporationDate: date(), // used for AML
  companyRegistrationNumber: string().required(),
  companyJurisdictionCode: string().required(), // country of incorporation
})

export const businessInfoController = async (
  req: Request<{}, {}, InferType<typeof businessInfoInput>>,
  res: Response
) => {
  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }
    const { address } = await verifyJw3t(req)
    await businessInfoInput.validate(req.body)

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

    const userDoc = await firestore().collection('users').doc(address).get()
    if (userDoc.exists && userDoc.data()?.stepsCompleted.businessInfoVerified) {
      throw new Error('businessInfoVerified step already completed')
    }

    // send email verfication link

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
        business_incorporation_date: businessIncorporationDate,
        ongoing: '0',
      },
    }
    const businessAML = await shuftiProRequest(req, payloadAML)
    const businessAmlVerified = businessAML.event === 'verification.accepted'

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_registration_number: companyRegistrationNumber,
        company_jurisdiction_code: companyJurisdictionCode,
      },
    }
    const kyb = await shuftiProRequest(req, kybPayload)
    const kybVerified = kyb.event === 'verification.accepted'

    const user = {
      lastUpdated: new Date(),
      address,
      email,
      businessName,
      trancheId,
      poolId,
      stepsCompleted: {
        businessInfoVerified: kybVerified && businessAmlVerified,
        emailConfirmed: false,
        businessOwnershipConfirmed: false,
        authorizedSignerVerified: false,
        taxInfoUploaded: false,
        subscriptionSigned: false,
      },
    }

    await validateAndWriteToFirestore(address, user, 'USER')

    res.json(user)
  } catch (error) {
    // @ts-expect-error
    functions.logger.log(error.message)
    // @ts-expect-error
    res.status(500).json({ error: error.message })
  }
}
