import { Request, Response } from 'express'
import { bool, InferType, object, string } from 'yup'
import { EntityUser, validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { validateInput } from '../../utils/validateInput'

const verifyBusinessInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests
  email: string().email().required(),
  poolId: string().required(),
  trancheId: string().required(),
  businessName: string().required(), // used for AML
  registrationNumber: string().required(),
  jurisdictionCode: string().required(), // country of incorporation
})

export const verifyBusinessController = async (
  req: Request<any, any, InferType<typeof verifyBusinessInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, verifyBusinessInput)
    const {
      walletAddress,
      body: { jurisdictionCode, registrationNumber, businessName, trancheId, poolId, email, dryRun },
    } = { ...req }

    const existingUser = await fetchUser(walletAddress, { suppressError: true })
    if (existingUser && existingUser.investorType !== 'entity') {
      throw new HttpError(400, 'Verify business is only available for investorType "entity"')
    }

    if (existingUser && existingUser.investorType === 'entity' && existingUser.globalSteps?.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
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
      kycReference: '',
      wallet: {
        address: walletAddress,
        network: req.walletAddress.startsWith('0x') ? 'ethereum' : 'substrate',
      },
      name: null,
      dateOfBirth: null,
      countryOfCitizenship: null,
      countryOfResidency: null,
      email,
      businessName,
      ultimateBeneficialOwners: businessAML?.verification_data?.kyb?.company_ultimate_beneficial_owners || [],
      registrationNumber,
      jurisdictionCode,
      globalSteps: {
        verifyBusiness: { completed: !!(kybVerified && businessAmlVerified), timeStamp: new Date().toISOString() },
        verifyEmail: { completed: false, timeStamp: null },
        confirmOwners: { completed: false, timeStamp: null },
        verifyIdentity: { completed: false, timeStamp: null },
        verifyAccreditation: { completed: false, timeStamp: null },
        verifyTaxInfo: { completed: false, timeStamp: null },
      },
      poolSteps: {
        [poolId]: {
          [trancheId]: {
            signAgreement: {
              completed: false,
              timeStamp: null,
              transactionInfo: {
                extrinsicHash: null,
                blockNumber: null,
              },
            },
            status: {
              status: null,
              timeStamp: null,
            },
          },
        },
      },
    }

    await validateAndWriteToFirestore(walletAddress, user, 'entity')
    await sendVerifyEmailMessage(user)
    const freshUserData = await fetchUser(walletAddress)
    return res.status(200).json({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
