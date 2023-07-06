import BN from 'bn.js'
import { fetchFromTinlakeSubgraph } from './fetchFromTinlakeSubgraph'

type PoolsDailyData = {
  day: number
  poolValue: number
}

export async function getTinlakeSubgraphTVL() {
  const query = `
    query PoolsDailyData {
      days(orderBy: id, orderDirection: desc, first: 1000) {
        id
        assetValue
        reserve
      }
    }
  `

  const data = await fetchFromTinlakeSubgraph(query)
  const UintBase = new BN(10).pow(new BN(18))

  const poolsDailyData =
    data && data?.days
      ? data.days
          .map((item: any) => {
            return {
              day: Number(item.id),
              poolValue: parseFloat(new BN(item.assetValue).add(new BN(item.reserve)).div(UintBase).toString()),
            }
          })
          .sort((a: PoolsDailyData, b: PoolsDailyData) => a.day - b.day)
      : []

  return poolsDailyData
}
