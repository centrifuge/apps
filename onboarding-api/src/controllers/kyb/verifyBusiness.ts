import * as dotenv from 'dotenv'
import { Request, Response } from 'express'
import { bool, date, InferType, object, string } from 'yup'
import { Business, businessCollection, User, userCollection, validateAndWriteToFirestore } from '../../database'
import { HttpsError } from '../../utils/httpsError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

dotenv.config()

const verifyBusinessInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests
  email: string().email().required(),
  address: string().required(),
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  incorporationDate: date().required(), // used for AML
  registrationNumber: string().required(),
  jurisdictionCode: string().required(), // country of incorporation
})

/**
 * Step 2
 */
export const verifyBusinessController = async (
  req: Request<any, any, InferType<typeof verifyBusinessInput>>,
  res: Response
) => {
  let shuftiErrors: string[] = []
  try {
    const { walletAddress } = req
    await validateInput(req, verifyBusinessInput)

    const {
      body: { incorporationDate, jurisdictionCode, registrationNumber, businessName, trancheId, poolId, email, dryRun },
    } = { ...req }

    const userDoc = await userCollection.doc(req.walletAddress).get()
    if (!userDoc.exists) {
      throw new HttpsError(400, 'User must be created before verifying business (/createUser)')
    }

    const userData = userDoc.data() as User
    if (!userData?.pools.find((pool) => pool.poolId === poolId && pool.investorType === 'entity')) {
      throw new HttpsError(400, 'Verify business is only available for investorType "entity"')
    }

    const businessDoc = await businessCollection.doc(walletAddress).get()
    if (businessDoc.exists && businessDoc.data()?.kybCompleted) {
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
    if (!businessAmlVerified) {
      shuftiErrors = [...shuftiErrors, 'Business AML failed']
      console.warn('Business AML failed')
    }

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_jurisdiction_code: jurisdictionCode,
        company_registration_number: registrationNumber,
      },
    }
    const kyb = await shuftiProRequest(req, kybPayload, { dryRun })
    const kybVerified = kyb.event === 'verification.accepted'
    if (!kybVerified) {
      shuftiErrors = [...shuftiErrors, 'KYB failed']
      console.warn('KYB failed')
    }

    const user: Partial<User> = {
      pools: [
        {
          trancheId,
          poolId,
          investorType: 'entity',
        },
      ],
    }

    const business: Partial<Business> = {
      walletAddress,
      email,
      businessName,
      ultimateBeneficialOwners: businessAML?.verification_data?.kyb?.company_ultimate_beneficial_owners || [],
      registrationNumber,
      incorporationDate,
      jurisdictionCode,
    }

    await validateAndWriteToFirestore(walletAddress, business, 'BUSINESS')
    await validateAndWriteToFirestore(walletAddress, user, 'USER', ['pools'])

    return res.status(200).json({
      errors: shuftiErrors,
      ...business,
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
