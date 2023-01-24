import { Request, Response } from 'express'
import { bool, date, InferType, object, string } from 'yup'
import { EntityUser, OnboardingUser, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const verifyBusinessInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests
  email: string().email().required(),
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  incorporationDate: date().required(), // used for AML
  registrationNumber: string().required(),
  jurisdictionCode: string().required(), // country of incorporation
})

export const verifyBusinessController = async (
  req: Request<any, any, InferType<typeof verifyBusinessInput>>,
  res: Response
) => {
  try {
    const { walletAddress } = req
    await validateInput(req, verifyBusinessInput)

    const {
      body: { incorporationDate, jurisdictionCode, registrationNumber, businessName, trancheId, poolId, email, dryRun },
    } = { ...req }

    const entityDoc = await userCollection.doc(req.walletAddress).get()
    const entityData = entityDoc.data() as OnboardingUser
    if (entityDoc.exists && entityData.investorType !== 'entity') {
      throw new HttpsError(400, 'Verify business is only available for investorType "entity"')
    }

    // @ts-expect-error
    if (entityDoc.exists && entityData.steps?.verifyBusiness.completed) {
      throw new HttpsError(400, 'Business already verified')
    }

    // TODO: send email verfication link

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
        business_incorporation_date: incorporationDate,
      },
    }
    const businessAML = await shuftiProRequest(req, payloadAML, { dryRun })
    const businessAmlVerified = businessAML.event === 'verification.accepted'

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_jurisdiction_code: jurisdictionCode,
        company_registration_number: registrationNumber,
      },
    }
    const kyb = await shuftiProRequest(req, kybPayload, { dryRun })
    const kybVerified = kyb.event === 'verification.accepted'

    const user: EntityUser = {
      investorType: 'entity',
      wallet: {
        address: walletAddress,
        network: 'polkadot',
      },
      kycReference: '',
      name: null,
      dateOfBirth: null,
      countryOfCitizenship: null,
      email,
      businessName,
      ultimateBeneficialOwners: businessAML?.verification_data?.kyb?.company_ultimate_beneficial_owners || [],
      registrationNumber,
      incorporationDate,
      jurisdictionCode,
      steps: {
        verifyBusiness: { completed: !!(kybVerified && businessAmlVerified), timeStamp: new Date().toISOString() },
        verifyEmail: { completed: false, timeStamp: null },
        confirmOwners: { completed: false, timeStamp: null },
        verifyIdentity: { completed: false, timeStamp: null },
        signAgreements: {
          [poolId]: {
            [trancheId]: {
              completed: false,
              timeStamp: null,
            },
          },
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, user, 'entity')

    const freshUserData = await userCollection.doc(walletAddress).get()
    return res.status(200).json({
      ...freshUserData.data(),
    })
  } catch (error) {
    if (error instanceof HttpsError) {
      console.log(error.message)
      return res.status(error.code).send(error.message)
    }
    console.log(error)
    return res.status(500).send('An unexpected error occured')
  }
}
