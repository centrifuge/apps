import { Pool } from '@centrifuge/centrifuge-js'
import { Request } from 'express'
import { sendEmail, templateIds } from '.'
import { fetchUser } from '../utils/fetchUser'

export const sendApproveIssuerMessage = async (
  wallet: Request['wallet'],
  metadata: Record<string, any>,
  tranche: Pool['tranches'][0],
  countersignedAgreementPDF: Uint8Array
) => {
  const user = await fetchUser(wallet)
  const message = {
    personalizations: [
      {
        to: [
          {
            email: metadata?.pool?.issuer?.email,
          },
        ],
        dynamic_template_data: {
          trancheName: tranche.currency.name,
          investorEmail: user.email,
        },
      },
    ],
    template_id: templateIds.investorApprovedIssuer,
    from: {
      name: 'Centrifuge',
      email: `noreply@centrifuge.io`,
    },
    attachments: [
      {
        content: Buffer.from(countersignedAgreementPDF).toString('base64'),
        filename: `${wallet.address}-${tranche.currency.name?.replaceAll(' ', '-')}-subscription-agreement.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
