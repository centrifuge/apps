import { Request } from 'express'
import * as jwt from 'jsonwebtoken'
import { sendEmail, templateIds } from '.'
import { fetchTaxInfo } from '../utils/fetchTaxInfo'
import { fetchUser } from '../utils/fetchUser'
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

  const attachments = [
    {
      content: Buffer.from(signedAgreement).toString('base64'),
      filename: 'pool-agreement.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    },
  ]
  const taxInfoPDF = metadata.onboarding.taxInfoRequired ? await fetchTaxInfo(wallet) : null
  if (taxInfoPDF) {
    attachments.push({
      content: taxInfoPDF[0].toString('base64'),
      filename: 'tax-info.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    })
  }

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
    attachments,
  }
  await sendEmail(message)
}
