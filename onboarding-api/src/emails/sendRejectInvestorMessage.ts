import { Request } from 'express'
import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/centrifuge'

export const sendRejectInvestorMessage = async (to: string, poolId: string, wallet: Request['wallet']) => {
  const { metadata } = await getPoolById(poolId, wallet)
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
