// import { PoolService } from '../services/pool.service'
// import config from '../config'
// import { Tranche } from '../controllers/types'

// export const throwErrorAndReturn = async (error: string, poolService: PoolService, poolId?: string, tranche?: Tranche) => {
//   console.error(error)

//   if (!poolId) return config.tinlakeUiHost

//   const pool = await poolService.get(poolId)
//   if (!pool) return config.tinlakeUiHost

//   const returnUrl = tranche ? `${config.tinlakeUiHost}pool/${poolId}/${pool.metadata.slug}/onboarding?tranche=${tranche}` : `${config.tinlakeUiHost}pool/${poolId}/${pool.metadata.slug}/onboarding`
//   return res.redirect(returnUrl)
// }
