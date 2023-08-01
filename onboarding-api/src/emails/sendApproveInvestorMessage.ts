import { Pool } from '@centrifuge/centrifuge-js'
import { sendEmail, templateIds } from '.'

export const sendApproveInvestorMessage = async (
  to: string,
  poolId: string,
  tranche: Pool['tranches'][0],
  poolMetadata: Record<string, any>,
  countersignedAgreementPDF: Uint8Array
) => {
  const message = {
    personalizations: [
      {
        to: [
          {
            email: to,
          },
        ],
        dynamic_template_data: {
          poolName: poolMetadata?.pool.name,
          trancheName: tranche?.currency.name,
          poolUrl: `${process.env.REDIRECT_URL}/pools/${poolId}`,
        },
      },
    ],
    template_id: templateIds.investorApproved,
    from: {
      name: 'Centrifuge',
      email: `issuer+${poolMetadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
    attachments: [
      {
        content: Buffer.from(countersignedAgreementPDF).toString('base64'),
        filename: `${tranche?.currency.name?.replaceAll(' ', '-')}-subscription-agreement.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
