import Centrifuge from '@centrifuge/centrifuge-js'
import { firstValueFrom } from 'rxjs'

export const centrifuge = new Centrifuge({
  centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
})

export const getPoolById = async (poolId: string) => {
  const pools = await firstValueFrom(centrifuge.pools.getPools())
  const pool = pools.find((p) => p.id === poolId)
  const metadata = await firstValueFrom(centrifuge.metadata.getMetadata(pool?.metadata!))
  return { pool, metadata }
}

const TenYearsFromNow = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)
export const whitelistInvestor = async (walletAddress: string, poolId: string, trancheId: string) => {
  await firstValueFrom(
    centrifuge.pools.updatePoolRoles([poolId, [], [[walletAddress, { TrancheInvestor: [trancheId, TenYearsFromNow] }]]])
  )
}
