import { HttpError } from '../utils/httpError'
import { NetworkSwitch } from '../utils/networks/networkSwitch'

export const canOnboardToTinlakeTranche = async (req, res, next) => {
  const poolId = req.query.poolId || req.body.poolId
  const trancheId = req.query.trancheId || req.body.trancheId

  if (poolId?.startsWith('0x')) {
    const { metadata } = await new NetworkSwitch(req.wallet.network).getPoolById(poolId)
    const trancheName = trancheId.split('-')[1] === '0' ? 'junior' : 'senior'

    if (metadata?.pool?.newInvestmentsStatus?.[trancheName] !== 'open') {
      throw new HttpError(403, 'Forbidden')
    }
  }

  next()
}
