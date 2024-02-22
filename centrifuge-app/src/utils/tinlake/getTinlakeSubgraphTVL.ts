import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { fetchFromTinlakeSubgraph } from './fetchFromTinlakeSubgraph'

export async function getTinlakeSubgraphTVL() {
  const query = `
    query ($first: Int!, $skip: Int!) {
      days(orderBy: id, orderDirection: asc, first: $first, skip: $skip) {
        id
        assetValue
        reserve
      }
    }
  `
  let skip = 0
  const limit = 1000

  const data: {
    id: string
    assetValue: string
    reserve: string
  }[] = []

  // subgraph only returns 1000 entries, fetch until no more entries are returned
  while (true) {
    const response: any = await fetchFromTinlakeSubgraph(query, { first: 1000, skip: skip })
    data.push(...response.days)
    if (response.days.length < limit) {
      break
    }
    skip += limit
  }

  const poolsDailyData = data.map(({ id, assetValue, reserve }) => ({
    dateInMilliseconds: new Date(Number(id) * 1000).setHours(0, 0, 0, 0),
    tvl: new CurrencyBalance(new BN(assetValue || '0').add(new BN(reserve || '0')), 18).toDecimal(),
  }))

  return poolsDailyData
}
