import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/centrifuge'

export const sendVerifiedBusinessMessage = async (to: string, poolId: string, trancheId: string) => {
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
          trancheId,
        },
      },
    ],
    template_id: poolId && trancheId ? templateIds.manualOnboardedPoolApproved : templateIds.manualOnboardedApproved,
    from: {
      name: 'Centrifuge',
      email: `issuer+${metadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
