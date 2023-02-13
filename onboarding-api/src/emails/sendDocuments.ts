import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/getPoolById'

export type UpdateInvestorStatusPayload = {
  poolId: string
  walletAddress: string
  trancheId: string
}

export const sendDocuments = async (
  walletAddress: string,
  poolId: string,
  trancheId: string,
  taxInfo: any,
  signedAgreement: any
) => {
  const { metadata } = await getPoolById(poolId)
  const payload: UpdateInvestorStatusPayload = { walletAddress, poolId, trancheId }
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  const message = {
    personalizations: [
      {
        to: [
          {
            email: metadata?.pool?.issuer?.email || 'jp@k-f.co', // TODO: remove, obvs
          },
        ],
        dynamic_template_data: {
          rejectLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=rejected`,
          approveLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=approved`,
          disclaimerLink: `${process.env.REDIRECT_URL}/disclaimer`,
        },
      },
    ],
    template_id: templateIds.updateInvestorStatus,
    from: {
      name: 'Centrifuge',
      email: `hello@centrifuge.io`,
    },
    attachments: [
      {
        content: taxInfo,
        filename: 'tax-info.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
      {
        content: signedAgreement,
        filename: 'pool-agreement.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
