import { Request } from 'express'
import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { onboardingBucket } from '../database'
import { fetchUser } from '../utils/fetchUser'
import { HttpError } from '../utils/httpError'
import { NetworkSwitch } from '../utils/networks/networkSwitch'

export type UpdateInvestorStatusPayload = {
  poolId: string
  wallet: Request['wallet']
  trancheId: string
}

// send documents to issuer to approve or reject the prospective investor
export const sendDocumentsMessage = async (
  wallet: Request['wallet'],
  poolId: string,
  trancheId: string,
  signedAgreement: Uint8Array,
  debugEmail?: string
) => {
  const { metadata, pool } = await new NetworkSwitch(wallet.network).getPoolById(poolId)
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const investorEmail = (await fetchUser(wallet)).email
  const payload: UpdateInvestorStatusPayload = { wallet, poolId, trancheId }
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '14d',
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
            email: debugEmail || metadata?.pool?.issuer?.email,
          },
        ],
        dynamic_template_data: {
          rejectLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=rejected&metadata=${pool?.metadata}`,
          approveLink: `${process.env.REDIRECT_URL}/onboarding/updateInvestorStatus?token=${encodeURIComponent(
            token
          )}&status=approved&metadata=${pool?.metadata}&network=${wallet.network}`,
          disclaimerLink: `${process.env.REDIRECT_URL}/disclaimer`,
          trancheName: tranche?.currency.name,
          investorEmail,
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
