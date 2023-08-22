import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import {
  EntityUser,
  OnboardingUser,
  transactionInfoSchema,
  validateAndWriteToFirestore,
  writeToOnboardingBucket,
} from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { annotateAgreementAndSignAsInvestor } from '../../utils/annotateAgreementAndSignAsInvestor'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { NetworkSwitch } from '../../utils/networks/networkSwitch'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

export const signAndSendDocumentsInput = object({
  poolId: string().required(),
  trancheId: string().required(),
  transactionInfo: transactionInfoSchema.required(),
  debugEmail: string().optional(), // sends email to specified address instead of issuer
})

export const signAndSendDocumentsController = async (
  req: Request<any, any, InferType<typeof signAndSendDocumentsInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, signAndSendDocumentsInput)

    const { poolId, trancheId, transactionInfo, debugEmail } = req.body
    const { wallet } = req

    const { poolSteps, globalSteps, investorType, name, email, ...user } = await fetchUser(wallet)
    const { metadata } = await new NetworkSwitch(wallet.network).getPoolById(poolId)
    if (
      investorType === 'individual' &&
      metadata?.onboarding?.kycRestrictedCountries?.includes(user.countryOfCitizenship)
    ) {
      throw new HttpError(400, 'Country not supported by issuer')
    }

    if (
      investorType === 'entity' &&
      metadata?.onboarding?.kybRestrictedCountries?.includes((user as EntityUser).jurisdictionCode!)
    ) {
      throw new HttpError(400, 'Country not supported by issuer')
    }

    const remark = `I hereby sign the subscription agreement of pool ${poolId} and tranche ${trancheId}: ${metadata
      .onboarding.tranches[trancheId].agreement?.uri!}`

    await new NetworkSwitch(wallet.network).validateRemark(wallet, transactionInfo, remark)

    if (
      poolSteps?.[poolId]?.[trancheId]?.signAgreement.completed &&
      poolSteps?.[poolId]?.[trancheId]?.status.status !== null
    ) {
      throw new HttpError(400, 'User has already signed the agreement')
    }

    const signedAgreementPDF = await annotateAgreementAndSignAsInvestor({
      poolId,
      trancheId,
      wallet,
      transactionInfo,
      name: name as string,
      email: email as string,
    })

    await writeToOnboardingBucket(
      signedAgreementPDF,
      `signed-subscription-agreements/${wallet.address}/${poolId}/${trancheId}.pdf`
    )

    if ((investorType === 'entity' && globalSteps.verifyBusiness.completed) || investorType === 'individual') {
      await sendDocumentsMessage(wallet, poolId, trancheId, signedAgreementPDF, debugEmail)
    }

    const updatedUser: Subset<OnboardingUser> = {
      poolSteps: {
        ...poolSteps,
        [poolId]: {
          [trancheId]: {
            signAgreement: {
              completed: true,
              timeStamp: new Date().toISOString(),
              transactionInfo,
            },
            status: {
              status: 'pending',
              timeStamp: new Date().toISOString(),
            },
          },
        },
      },
    }

    await validateAndWriteToFirestore(wallet, updatedUser, investorType, ['poolSteps'])
    const freshUserData = await fetchUser(wallet)
    return res.status(201).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
