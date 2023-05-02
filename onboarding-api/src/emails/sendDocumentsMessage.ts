import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { onboardingBucket, Wallet } from '../database'
import { getPoolById } from '../utils/centrifuge'
import { HttpError } from '../utils/httpError'
import { getTinlakePoolById } from '../utils/tinlake'

export type UpdateInvestorStatusPayload = {
  poolId: string
  wallet: Wallet[0]
  trancheId: string
}

export const sendDocumentsMessage = async (
  wallet: Wallet[0],
  poolId: string,
  trancheId: string,
  signedAgreement: Uint8Array
) => {
  const { metadata, pool } =
    wallet.network === 'substrate' ? await getPoolById(poolId) : await getTinlakePoolById(poolId)
  const payload: UpdateInvestorStatusPayload = { wallet, poolId, trancheId }
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  const taxInfoFile = await onboardingBucket.file(`tax-information/${wallet.address}.pdf`)
  const [taxInfoExists] = await taxInfoFile.exists()

  if (!taxInfoExists) {
    throw new HttpError(400, 'Tax info not found')
  }
  const taxInfoPDF = await taxInfoFile.download()

  const message = {
    personalizations: [
      {
        to: [
          {
            email: metadata?.pool?.issuer?.email,
          },
        ],
        dynamic_template_data: {
          rejectLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=rejected&metadata=${pool?.metadata}`,
          approveLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=approved&metadata=${pool?.metadata}`,
          disclaimerLink: `${process.env.REDIRECT_URL}/disclaimer`,
        },
      },
    ],
    template_id: templateIds.updateInvestorStatus,
    from: {
      name: 'Centrifuge',
      email: 'hello@centrifuge.io',
    },
    attachments: [
      {
        content: taxInfoPDF[0].toString('base64'),
        filename: 'tax-info.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
      {
        content: Buffer.from(signedAgreement).toString('base64'),
        filename: 'pool-agreement.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
