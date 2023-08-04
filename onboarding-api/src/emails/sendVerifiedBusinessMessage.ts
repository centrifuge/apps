import { Request } from 'express'
import { sendEmail, templateIds } from '.'
import { NetworkSwitch } from '../utils/networks/networkSwitch'

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
  wallet: Request['wallet'],
  to: string,
  isApproved: boolean,
  poolId?: string,
  trancheId?: string
) => {
  const isGloballyOnboarding = !poolId || !trancheId

  let pool
  let metadata
  let trancheName

  if (!isGloballyOnboarding) {
    const poolData = await new NetworkSwitch(wallet.network).getPoolById(poolId)
    pool = poolData.pool
    metadata = poolData.metadata

    trancheName = pool?.tranches.find((t) => t.id === trancheId)?.currency.name
  }

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
            poolName: metadata?.pool.name,
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
