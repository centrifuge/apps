import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/centrifuge'

export const sendApproveIssuerMessage = async (
  walletAddress: string,
  poolId: string,
  trancheId: string,
  countersignedAgreementPDF: Uint8Array
) => {
  const { metadata, pool } = await getPoolById(poolId)
  const trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name

  const message = {
    personalizations: [
      {
        to: [
          {
            email: metadata?.pool?.issuer?.email,
          },
        ],
        dynamic_template_data: {
          tokenName: trancheName,
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
        filename: `${walletAddress}-${trancheName?.replaceAll(' ', '-')}-subscription-agreement.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  }
  await sendEmail(message)
}
