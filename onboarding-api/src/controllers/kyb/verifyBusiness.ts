import { Request, Response } from 'express'
import { bool, InferType, object, string } from 'yup'
import { EntityUser, OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendVerifyEmailMessage } from '../../emails/sendVerifyEmailMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const verifyBusinessInput = object({
  dryRun: bool().default(false).optional(), // skips shuftipro requests
  email: string().email().required(),
  businessName: string().required(), // used for AML
  registrationNumber: string().required(),
  jurisdictionCode: string().required(), // country of incorporation
  manualReview: bool().required(),
  poolId: string().optional(),
  trancheId: string().optional(),
})

export const verifyBusinessController = async (
  req: Request<any, any, InferType<typeof verifyBusinessInput>>,
  res: Response
) => {
  try {
    const { body, wallet } = req
    await validateInput(body, verifyBusinessInput)
    const { jurisdictionCode, registrationNumber, businessName, email, manualReview, dryRun } = body

    const userData = (await fetchUser(wallet, { suppressError: true })) as EntityUser

    if (userData?.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    if (userData.manualKybReference) {
      const status = await shuftiProRequest(
        { reference: userData.manualKybReference },
        { path: 'status', dryRun: false }
      )

      if (status.event === 'request.pending' || status.event === 'review.pending') {
        throw new HttpError(400, 'Business already in review')
      }
    }

    const kybReference = `KYB_${Math.random()}`

    const user: EntityUser = {
      investorType: 'entity',
      kycReference: '',
      manualKybReference: manualReview ? kybReference : undefined,
      wallet: [wallet],
      name: null,
      dateOfBirth: null,
      countryOfCitizenship: null,
      countryOfResidency: null,
      email,
      businessName,
      ultimateBeneficialOwners: [],
      registrationNumber,
      jurisdictionCode,
      globalSteps: {
        verifyBusiness: {
          completed: false,
          timeStamp: null,
        },
        verifyEmail: { completed: false, timeStamp: null },
        confirmOwners: { completed: false, timeStamp: null },
        verifyIdentity: { completed: false, timeStamp: null },
        verifyAccreditation: { completed: false, timeStamp: null },
        verifyTaxInfo: { completed: false, timeStamp: null },
      },
      poolSteps: {},
    }

    await validateAndWriteToFirestore(wallet, user, 'entity')

    if (manualReview) {
      const searchParams = new URLSearchParams({
        ...wallet,
        ...(body.poolId && body.trancheId && { poolId: body.poolId, trancheId: body.trancheId }),
      })

      const payloadKYB = {
        manual_review: 1,
        enable_extra_proofs: 1,
        labels: [
          'articles_of_association',
          // 'certificate_of_incorporation',
          // 'proof_of_address',
          // 'register_of_directors',
          // 'register_of_shareholders',
          // 'signed_and_dated_ownership_structure',
        ],
        verification_mode: 'any',
        reference: kybReference,
        email: body.email,
        country: body.jurisdictionCode,
        redirect_url: '',

        callback_url: `${process.env.ONBOARDING_API_URL}/kyb-callback?${searchParams}`,
        // callback_url: `https://young-pants-invite-85-149-106-77.loca.lt/kyb-callback?${searchParams}`,
      }

      const kyb = await shuftiProRequest(payloadKYB)
      const freshUserData = await fetchUser(wallet)

      return res.send({ ...kyb, ...freshUserData })
    }

    const payloadAML = {
      reference: `BUSINESS_AML_REQUEST_${Math.random()}`,
      aml_for_businesses: {
        business_name: businessName,
      },
    }
    const businessAML = await shuftiProRequest(payloadAML, { dryRun })
    const businessAmlVerified = businessAML.event === 'verification.accepted'

    const kybPayload = {
      reference: `KYB_REQUEST_${Math.random()}`,
      kyb: {
        company_jurisdiction_code: jurisdictionCode,
        company_registration_number: registrationNumber,
      },
    }
    const kyb = await shuftiProRequest(kybPayload, { dryRun })
    const kybVerified = kyb.event === 'verification.accepted'

    const updatedUser: Subset<OnboardingUser> = {
      ultimateBeneficialOwners: businessAML?.verification_data?.kyb?.company_ultimate_beneficial_owners || [],
      globalSteps: {
        verifyBusiness: {
          completed: kybVerified && businessAmlVerified,
          timeStamp: new Date().toISOString(),
        },
      },
    }

    await validateAndWriteToFirestore(wallet, updatedUser, 'entity', [
      'ultimateBeneficialOwners',
      'globalSteps.verifyBusiness',
    ])

    await sendVerifyEmailMessage(user, wallet)
    const freshUserData = await fetchUser(wallet)

    return res.status(200).json({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
