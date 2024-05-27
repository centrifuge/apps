import { addressToHex } from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifugeApi, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { map } from 'rxjs'
import { isSubstrateAddress } from './address'
import { usePools } from './usePools'

function usePoolFeeders() {
  const api = useCentrifugeApi()
  const [storedInfo] = useCentrifugeQuery(['oracleCollectionInfos'], () =>
    api.query.oraclePriceCollection.collectionInfo.entries().pipe(
      map((data) => {
        const poolsByFeeder: Record<string, string[]> = {}
        const feedersByPool: Record<string, { minFeeders: number; valueLifetime: number; feeders: string[] }> = {}
        data.forEach(([keys, value]) => {
          const poolId = (keys.toHuman() as string[])[0].replace(/\D/g, '')
          const info = value.toPrimitive() as any
          const feeders = info.feeders
            .filter((f: any) => !!f.system.signed)
            .map((f: any) => addressToHex(f.system.signed)) as string[]

          feeders.forEach((feeder) => {
            if (poolsByFeeder[feeder]) {
              poolsByFeeder[feeder].push(poolId)
            } else {
              poolsByFeeder[feeder] = [poolId]
            }
          })

          feedersByPool[poolId] = {
            valueLifetime: info.valueLifetime as number,
            minFeeders: info.minFeeders as number,
            feeders,
          }
        })

        return {
          poolsByFeeder,
          feedersByPool,
        }
      })
    )
  )

  return {
    poolsByFeeder: storedInfo?.poolsByFeeder ?? {},
    feedersByPool: storedInfo?.feedersByPool ?? {},
  }
}

export function usePoolsForWhichAccountIsFeeder(address?: string) {
  const defaultAddress = useAddress('substrate')
  address ??= defaultAddress
  const { poolsByFeeder } = usePoolFeeders()
  const poolIds = (address && isSubstrateAddress(address) && poolsByFeeder[address]) || []
  return usePools()?.filter((p) => poolIds.includes(p.id))
}
