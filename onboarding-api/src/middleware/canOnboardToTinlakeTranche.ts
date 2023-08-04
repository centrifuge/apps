import { NetworkSwitch } from '../utils/networks/networkSwitch'

export const canOnboardToTinlakeTranche = async (req, _res, next) => {
  const poolId = req.query.poolId || req.body.poolId
  const trancheId = req.query.trancheId || req.body.trancheId

  if (poolId?.startsWith('0x')) {
    const { metadata } = await new NetworkSwitch(req.wallet.network).getPoolById(poolId)
    const trancheName = trancheId.split('-')[1] === '0' ? 'junior' : 'senior'

    if (metadata?.pool?.newInvestmentsStatus?.[trancheName] !== 'open') {
      throw new Error('Forbidden')
    }
  }

  next()
}
