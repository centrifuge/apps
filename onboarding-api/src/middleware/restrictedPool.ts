import { HttpError } from '../utils/httpError'
import { isRestrictedPool } from '../utils/isRestrictedPool'

export const restrictedPool = (req, res, next) => {
  if (
    (req.body?.poolId && isRestrictedPool(req.body.poolId)) ||
    (req.query?.poolId && isRestrictedPool(req.query.poolId))
  ) {
    throw new HttpError(403, 'Forbidden')
  }

  next()
}
