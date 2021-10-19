import { baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import gql from 'graphql-tag'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from './queries'

interface DailyPoolData {
  day: {
    id: number
  }
  pool: {
    shortName: string
  }
  juniorTokenPrice: string
  seniorTokenPrice: string
}

const fetch = async (skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
    {
      dailyPoolDatas(first: ${first}, skip: ${skip} ${blockHash ? `, block: { hash: "${blockHash}" }` : ''}) {
        day {
          id
        }
        pool {
          shortName
        }
        juniorTokenPrice
        seniorTokenPrice
      }
      _meta {
        block {
          hash
          number
        }
      }
    }
    `)
}

export async function dailyTokenPrices() {
  let start = 0
  const limit = 1000

  const results: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // subgraph only returns 1000 entries, fetch until no more entries are returned
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetch(start, limit, blockHash)
    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    results.push(...response.dailyPoolDatas)
    if (response.dailyPoolDatas.length < limit) {
      break
    }
    start += limit
  }

  const groupedResults: { [day: string]: DailyPoolData[] } = results.reduce(
    (output: { [day: string]: DailyPoolData[] }, input: DailyPoolData) => {
      const day = input.day.id.toString()
      if (day in output) return { ...output, [day]: [...output[day], input] }
      return { ...output, [day]: [input] }
    },
    {}
  )

  const tokens = results.reduce((pools: { [key: string]: BN }, data: DailyPoolData) => {
    if (!pools[`${data.pool.shortName} DROP`]) {
      return {
        ...pools,
        [`${data.pool.shortName} DROP`]: new BN(10).pow(new BN(27)),
        [`${data.pool.shortName} TIN`]: new BN(10).pow(new BN(27)),
      }
    }
    return pools
  }, {})

  const summedResults = Object.keys(groupedResults).map((day: string) => {
    const data: any = groupedResults[day].reduce(
      (sum: any, input: DailyPoolData) => {
        return {
          ...sum,
          [`${input.pool.shortName} DROP`]: new BN(input.seniorTokenPrice).isZero()
            ? new BN(10).pow(new BN(27))
            : new BN(input.seniorTokenPrice),
          [`${input.pool.shortName} TIN`]: new BN(input.juniorTokenPrice).isZero()
            ? new BN(10).pow(new BN(27))
            : new BN(input.juniorTokenPrice),
        }
      },
      { day, ...tokens }
    )
    return data
  })

  const headers = ['Day', ...Object.keys(tokens)]
  const rows: string[][] = [
    headers,
    ...summedResults.map((el: any) => [
      el.day ? new Date(parseInt(el.day, 10) * 1000).toISOString().substr(0, 10) : '-',
      ...Object.keys(tokens).map((token: string) => {
        return el[token] ? toPrecision(baseToDisplay(el[token], 27), 8) : '0'
      }),
    ]),
  ]

  downloadCSV(rows, csvName(`Daily token prices`))
}
