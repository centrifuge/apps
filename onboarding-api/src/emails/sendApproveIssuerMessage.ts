import { Pool } from '@centrifuge/centrifuge-js'
import { sendEmail, templateIds } from '.'

export const sendApproveIssuerMessage = async (
  walletAddress: string,
  metadata: Record<string, any>,
  tranche: Pool['tranches'][0],
  countersignedAgreementPDF: Uint8Array
) => {
  const message = {
    personalizations: [
      {
        to: [
          {
            email: metadata?.pool?.issuer?.email,
          },
        ],
        dynamic_template_data: {
          tokenName: tranche.currency.name,
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
        filename: `${walletAddress}-${tranche.currency.name?.replaceAll(' ', '-')}-subscription-agreement.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
