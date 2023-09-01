import { Pool } from '@centrifuge/centrifuge-js'
import { sendEmail, templateIds } from '.'

export const sendRejectInvestorMessage = async (
  to: string,
  tranche: Pool['tranches'][0],
  metadata: Record<string, any>
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
          poolName: metadata?.pool.name,
          issuerEmail: metadata.pool.issuer.email,
          trancheName: tranche?.currency.name,
        },
      },
    ],
    template_id: templateIds.investorRejected,
    from: {
      name: 'Centrifuge',
      email: `issuer+${metadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
