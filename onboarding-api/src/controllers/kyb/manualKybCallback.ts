import { Request, Response } from 'express'
import { InferType, mixed, object, string } from 'yup'
import { onboardingBucket, OnboardingUser, validateAndWriteToFirestore } from '../../database'
import { sendDocumentsMessage } from '../../emails/sendDocumentsMessage'
import { sendVerifiedBusinessMessage } from '../../emails/sendVerifiedBusinessMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { shuftiProRequest } from '../../utils/shuftiProRequest'
import { ManualKybCallbackRequestBody, Subset, SupportedNetworks } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'

const manualKybCallbackInput = object({
  address: string().required(),
  network: mixed<SupportedNetworks>().required().oneOf(['evm', 'substrate']),
  poolId: string().optional(),
  trancheId: string().optional(),
})

export const manualKybCallbackController = async (
  req: Request<any, any, ManualKybCallbackRequestBody, InferType<typeof manualKybCallbackInput>>,
  res: Response
) => {
  try {
    const { body, query } = req

    await validateInput(query, manualKybCallbackInput)

    const wallet: Request['wallet'] = {
      address: query.address,
      network: query.network,
    }

    const user = await fetchUser(wallet)

    if (user.investorType !== 'entity') {
      throw new HttpError(400, 'User is not an entity')
    }

    if (user.globalSteps.verifyBusiness.completed) {
      throw new HttpError(400, 'Business already verified')
    }

    // if the documents have merely changed status, we don't need to do anything
    if (body.event !== 'verification.status.changed') {
      return res.status(200).end()
    }

    const status = await shuftiProRequest({ reference: body.reference }, { path: 'status' })

    if (status.event === 'verification.declined') {
      await sendVerifiedBusinessMessage(user.email, false, query.poolId, query.trancheId)
      return res.status(200).end()
    }

    if (status.event !== 'verification.accepted') {
      return res.status(200).end()
    }

    const updatedUser: Subset<OnboardingUser> = {
      globalSteps: {
        verifyBusiness: {
          completed: true,
          timeStamp: new Date().toISOString(),
        },
      },
    }

    await validateAndWriteToFirestore(wallet, updatedUser, 'entity', ['globalSteps.verifyBusiness'])
    await sendVerifiedBusinessMessage(user.email, true, query.poolId, query.trancheId)

    if (
      query.poolId &&
      query.trancheId &&
      user.poolSteps[query.poolId]?.[query.trancheId]?.status.status === 'pending'
    ) {
      const signedAgreement = await fetchSignedAgreement(wallet, query.poolId, query.trancheId)

      if (!signedAgreement) {
        throw new HttpError(400, 'Agreement not found')
      }

      sendDocumentsMessage(wallet, query.poolId, query.trancheId, signedAgreement)
    }

    return res.status(200).end()
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}

async function fetchSignedAgreement(wallet: Request['wallet'], poolId: string, trancheId: string) {
  const signedAgreement = await onboardingBucket.file(
    `signed-subscription-agreements/${wallet.address}/${poolId}/${trancheId}.pdf`
  )

  const [signedAgreementExists] = await signedAgreement.exists()

  if (!signedAgreementExists) {
    return null
  }

  const pdf = await signedAgreement.download()
  return Uint8Array.from(pdf[0])
}
