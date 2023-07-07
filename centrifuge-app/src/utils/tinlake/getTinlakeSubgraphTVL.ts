import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { fetchFromTinlakeSubgraph } from './fetchFromTinlakeSubgraph'

export async function getTinlakeSubgraphTVL() {
  const query = `
    query PoolsDailyData {
      days(orderBy: id, orderDirection: asc, first: 1000) {
        id
        assetValue
        reserve
      }
    }
  `

  const data: {
    days: {
      id: string
      assetValue: string
      reserve: string
    }[]
  } = await fetchFromTinlakeSubgraph(query)

  const poolsDailyData =
    data && data?.days
      ? data.days.map(({ id, assetValue, reserve }) => ({
          dateInMilliseconds: new Date(Number(id) * 1000).setHours(0, 0, 0, 0),
          tvl: new CurrencyBalance(new BN(assetValue || '0').add(new BN(reserve || '0')), 18).toDecimal(),
        }))
      : []

  return poolsDailyData
}
