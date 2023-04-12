import { Request, Response } from 'express'
import { InferType, object, string } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { annotateAgreementAndSignAsInvestor } from '../../utils/annotateAgreementAndSignAsInvestor'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'
import { validateRemark } from '../../utils/validateRemark'

export const signAndSendDocumentsInput = object({
  poolId: string().required(),
  trancheId: string().required(),
  transactionInfo: object({
    extrinsicHash: string().required(),
    blockNumber: string().required(),
  }).required(),
})

export const signAndSendDocumentsController = async (
  req: Request<any, any, InferType<typeof signAndSendDocumentsInput>>,
  res: Response
) => {
  try {
    await validateInput(req.body, signAndSendDocumentsInput)

    const { poolId, trancheId, transactionInfo } = req.body
    const { wallet } = req

    const user = await fetchUser(wallet)

    await validateRemark(transactionInfo, `Signed subscription agreement for pool: ${poolId} tranche: ${trancheId}`)

    if (
      user.poolSteps?.[poolId]?.[trancheId]?.signAgreement.completed &&
      user.poolSteps?.[poolId]?.[trancheId]?.status.status !== null
    ) {
      throw new HttpError(400, 'User has already signed the agreement')
    }

    const signedAgreementPDF = await annotateAgreementAndSignAsInvestor({
      poolId,
      trancheId,
      walletAddress: wallet.address,
      transactionInfo,
      name: user.name as string,
      email: user.email as string,
    })

    await writeToOnboardingBucket(
      signedAgreementPDF,
      `signed-subscription-agreements/${wallet.address}/${poolId}/${trancheId}.pdf`
    )

    await sendDocumentsMessage(wallet, poolId, trancheId, signedAgreementPDF)

    const updatedUser: Subset<OnboardingUser> = {
      poolSteps: {
        ...user?.poolSteps,
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

    await validateAndWriteToFirestore(wallet, updatedUser, user.investorType, ['poolSteps'])
    const freshUserData = fetchUser(wallet)
    return res.status(201).send({ ...freshUserData })
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
