import gql from 'graphql-tag'
import Apollo from '../../../services/apollo'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
import { csvName } from './index'

interface IDaily {
  account: {
    id: string
  }
  day: {
    id: string
  }
  seniorTokenValue: string
  juniorTokenValue: string
}

interface IResponse {
  dailyInvestorTokenBalances: IDaily[]
  _meta: {
    block: {
      hash: string
      number: number
    }
  }
}

const fetch = async (poolId: string, skip: number, first: number, blockHash: string | null): Promise<IResponse> => {
  return await Apollo.runCustomQuery(gql`
      {
        dailyInvestorTokenBalances(where:{pool:"${poolId.toLowerCase()}"}, first: ${first}, skip: ${skip} ${
    blockHash ? `, block: { hash: "${blockHash}" }` : ''
  }) {
          account{
            id
          }
          day {
            id
          }
          seniorTokenValue
          juniorTokenValue
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

export async function dailyInvestorBalances({ poolId }: { poolId: string; poolData: PoolData }) {
  let start = 0
  const limit = 1000

  const results: IDaily[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // subgraph only returns 1000 entries, fetch until no more entries are returned
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: IResponse = await fetch(poolId, start, limit, blockHash)
    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    results.push(...response.dailyInvestorTokenBalances)
    if (response.dailyInvestorTokenBalances.length < limit) {
      break
    }
    start += limit
  }

  const headers = ['Ethereum Address', 'Timestamp', 'Date', 'TIN Value', 'DROP Value']
  const data: string[][] = [
    headers,
    ...results.map((daily) => [
      daily.account.id,
      daily.day.id,
      new Date(parseInt(daily.day.id, 10) * 1000).toISOString().substr(0, 10),
      daily.juniorTokenValue,
      daily.seniorTokenValue,
    ]),
  ]

  downloadCSV(data, csvName(`Daily investor balances`))

  return true
}
