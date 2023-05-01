import { sendEmail, templateIds } from '.'
import { getPoolById } from '../utils/centrifuge'

const getTemplateId = (isGloballyOnboarding: boolean, isApproved: boolean) => {
  if (isGloballyOnboarding) {
    if (isApproved) {
      return templateIds.manualOnboardedApproved
    }

    return templateIds.manualOnboardedDeclined
  }

  if (isApproved) {
    return templateIds.manualOnboardedPoolApproved
  }

  return templateIds.manualOnboardedPoolDeclined
}

export const sendVerifiedBusinessMessage = async (
  to: string,
  isApproved: boolean,
  poolId: string,
  trancheId: string
) => {
  const isGloballyOnboarding = !poolId && !trancheId

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
        ...(!isGloballyOnboarding && {
          dynamic_template_data: {
            trancheName,
          },
        }),
      },
    ],
    template_id: getTemplateId(isGloballyOnboarding, isApproved),
    from: {
      name: 'Centrifuge',
      email: isGloballyOnboarding
        ? 'hello@centrifuge.io'
        : `issuer+${metadata.pool.name?.replaceAll(' ', '')}@centrifuge.io`,
    },
  }
  await sendEmail(message)
}
