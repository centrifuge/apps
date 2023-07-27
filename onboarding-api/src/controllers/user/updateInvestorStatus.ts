import { Pool } from '@centrifuge/centrifuge-js'
import { Request, Response } from 'express'
import { InferType, object, string, StringSchema } from 'yup'
import { OnboardingUser, validateAndWriteToFirestore, writeToOnboardingBucket } from '../../database'
import { sendApproveInvestorMessage } from '../../emails/sendApproveInvestorMessage'
import { sendApproveIssuerMessage } from '../../emails/sendApproveIssuerMessage'
import { UpdateInvestorStatusPayload } from '../../emails/sendDocumentsMessage'
import { sendRejectInvestorMessage } from '../../emails/sendRejectInvestorMessage'
import { fetchUser } from '../../utils/fetchUser'
import { HttpError, reportHttpError } from '../../utils/httpError'
import { NetworkSwitch } from '../../utils/networks/networkSwitch'
import { signAcceptanceAsIssuer } from '../../utils/signAcceptanceAsIssuer'
import { Subset } from '../../utils/types'
import { validateInput } from '../../utils/validateInput'
import { verifyJwt } from '../../utils/verifyJwt'

const updateInvestorStatusParams = object({
  token: string().required(),
  status: string().oneOf(['approved', 'rejected']).required() as StringSchema<'approved' | 'rejected'>,
})

export const updateInvestorStatusController = async (
  req: Request<any, any, any, InferType<typeof updateInvestorStatusParams>>,
  res: Response
) => {
  try {
    await validateInput(req.query, updateInvestorStatusParams)
    const {
      query: { token, status },
    } = req
    const payload = verifyJwt<UpdateInvestorStatusPayload>(token)
    const { poolId, trancheId, wallet } = payload

    const network = new NetworkSwitch(wallet.network)
    const { pool, metadata } = await network.getPoolById(poolId)
    const tranche = pool?.tranches.find((t) => t.id === trancheId)
    if (!pool || !tranche) {
      throw new HttpError(400, `Pool ${poolId} not found`)
    }

    const user = await fetchUser(wallet)

    const incompleteSteps = Object.entries(user.globalSteps).filter(([name, step]) => {
      if (name === 'verifyAccreditation') {
        if (user.investorType === 'individual' && user.countryOfCitizenship?.startsWith('us')) {
          return !step?.completed
        }

        if (user.investorType === 'entity' && user.jurisdictionCode?.startsWith('us')) {
          return !step?.completed
        }
        return false
      }
      return !step?.completed
    })

    if (incompleteSteps.length > 0) {
      throw new HttpError(
        400,
        `Incomplete onboarding steps for investor: ${incompleteSteps.map((step) => step[0]).join(', ')}`
      )
    }

    if (user.poolSteps[poolId][trancheId].status.status !== 'pending') {
      throw new HttpError(400, 'Investor status may have already been updated')
    }

    if (!user.poolSteps?.[poolId][trancheId].signAgreement.completed) {
      throw new HttpError(400, 'Argeements must be signed before investor status can invest')
    }

    const updatedUser: Subset<OnboardingUser> = {
      poolSteps: {
        ...user.poolSteps,
        [poolId]: {
          [trancheId]: {
            ...user.poolSteps[poolId][trancheId],
            status: {
              status,
              timeStamp: new Date().toISOString(),
            },
          },
        },
      },
    }

    if (user?.email && status === 'approved') {
      const countersignedAgreementPDF = await signAcceptanceAsIssuer({
        poolId,
        trancheId,
        wallet,
        investorName: user.name as string,
      })

      await writeToOnboardingBucket(
        countersignedAgreementPDF,
        `signed-subscription-agreements/${wallet.address}/${poolId}/${trancheId}.pdf`
      )

      const { txHash } = await network.addInvestorToMemberList(wallet, poolId, trancheId)
      await Promise.all([
        sendApproveInvestorMessage(
          user.email,
          poolId,
          tranche as Pool['tranches'][0],
          metadata,
          countersignedAgreementPDF
        ),
        sendApproveIssuerMessage(wallet.address, metadata, tranche as Pool['tranches'][0], countersignedAgreementPDF),
        validateAndWriteToFirestore(wallet, updatedUser, user.investorType, ['poolSteps']),
      ])
      return res.status(200).send({ status: 'approved', poolId, trancheId, txHash })
    } else if (user?.email && status === 'rejected') {
      await Promise.all([
        sendRejectInvestorMessage(user.email, metadata),
        validateAndWriteToFirestore(wallet, updatedUser, user.investorType, ['poolSteps']),
      ])
      return res.status(200).send({ status: 'rejected', poolId, trancheId })
    }
    throw new HttpError(400, 'Something went wrong whitelisting or sending email')
  } catch (e) {
    const error = reportHttpError(e)
    return res.status(error.code).send({ error: error.message })
  }
}
