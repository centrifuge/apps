import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/centrifuge'

export const sendApproveInvestorMessage = async (to: string, poolId: string, trancheId: string) => {
  const { pool, metadata } = await getPoolById(poolId)
  const trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name
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
          trancheName,
          poolUrl: `${process.env.REDIRECT_URL}/pools/${poolId}`,
        },
      },
    ],
    template_id: templateIds.investorApproved,
    from: {
      name: 'Centrifuge',
      email: `issuer+${metadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
