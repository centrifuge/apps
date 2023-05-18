import { getPoolById } from '../utils/getPoolById'
import { HttpError } from '../utils/httpError'

export const canOnboardToTinlakeTranche = async (req, res, next) => {
  const trancheId = req.query.trancheId || req.body.trancheId

  if (trancheId?.startsWith('0x')) {
    const { metadata } = await getPoolById(trancheId.split('-')[0])

    const trancheName = trancheId.split('-')[1] === '0' ? 'junior' : 'senior'

    if (metadata?.pool?.newInvestmentsStatus[trancheName] !== 'open') {
      throw new HttpError(403, 'Forbidden')
    }
  }

  next()
}
