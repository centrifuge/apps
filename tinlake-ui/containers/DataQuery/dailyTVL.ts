import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import gql from 'graphql-tag'
import { string } from 'prop-types'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from './queries'

interface DailyPoolData {
  day: {
    id: number
  }
  pool: {
    id: string
  }
  reserve: string
  assetValue: string
}

interface SystemWideData {
  reserve: BN
  assetValue: BN
}

const fetch = async (skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
    {
      dailyPoolDatas(first: ${first}, skip: ${skip} ${blockHash ? `, block: { hash: "${blockHash}" }` : ''}) {
        day {
          id
        }
        pool {
          id
        }
        reserve
        assetValue
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

export async function dailyTVL() {
  let start = 0
  const limit = 1000

  const results: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // subgraph only returns 1000 entries, fetch until no more entries are returned
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
      else return { ...output, [day]: [input] }
    },
    {}
  )

  const summedResults = Object.keys(groupedResults).map((day: string) => {
    const data = groupedResults[day].reduce(
      (sum: { day: string; reserve: BN; assetValue: BN }, input: DailyPoolData) => {
        return {
          day: sum.day,
          reserve: sum.reserve.add(new BN(input.reserve)),
          assetValue: sum.assetValue.add(new BN(input.assetValue)),
        }
      },
      { day, reserve: new BN(0), assetValue: new BN(0) }
    )
    return data
  })

  console.log(summedResults)

  const headers = ['Day', 'NAV', 'Reserve', 'TVL']
  const rows: string[][] = [
    headers,
    ...summedResults.map((el: any) => [
      el.day ? new Date(parseInt(el.day, 10) * 1000).toISOString().substr(0, 10) : '-',
      el.assetValue ? toPrecision(baseToDisplay(el.assetValue, 18), 0) : '-',
      el.reserve ? toPrecision(baseToDisplay(el.reserve, 18), 0) : '-',
      el.reserve && el.assetValue ? toPrecision(baseToDisplay(el.assetValue.add(el.reserve), 18), 0) : '-',
    ]),
  ]

  downloadCSV(rows, csvName(`Daily tvl`))
}
