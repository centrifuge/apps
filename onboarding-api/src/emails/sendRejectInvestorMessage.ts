import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/getPoolById'

export const sendRejectInvestorMessage = async (to: string, poolId: string) => {
  const { metadata } = await getPoolById(poolId)
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
