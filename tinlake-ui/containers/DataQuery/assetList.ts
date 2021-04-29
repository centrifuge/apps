import { addThousandsSeparators, baseToDisplay, feeToInterestRate, toPrecision } from '@centrifuge/tinlake-js'
import gql from 'graphql-tag'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from './queries'

const fetch = async (skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
    {
      loans(first: ${first}, skip: ${skip} ${blockHash ? `, block: { hash: "${blockHash}" }` : ''}) {
        pool {
          shortName
        }
        index
        id
        borrowsAggregatedAmount
        repaysAggregatedAmount
        financingDate
        maturityDate
        interestRatePerSecond
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

export async function assetList() {
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
    results.push(...response.loans)
    if (response.loans.length < limit) {
      break
    }
    start += limit
  }

  const headers = [
    'Pool',
    'Asset ID',
    'NFT ID',
    'Financing Date',
    'Maturity Date',
    'Borrowed Amount (DAI)',
    'Repaid Amount (DAI)',
    'Financing Fee',
  ]
  const rows: string[][] = [
    headers,
    ...results.map((el: any) => [
      el.pool.shortName,
      el.index,
      el.id,
      el.financingDate ? new Date(parseInt(el.financingDate, 10) * 1000).toISOString().substr(0, 10) : '-',
      el.maturityDate ? new Date(parseInt(el.maturityDate, 10) * 1000).toISOString().substr(0, 10) : '-',
      el.borrowsAggregatedAmount
        ? addThousandsSeparators(toPrecision(baseToDisplay(el.borrowsAggregatedAmount || '0', 18), 0))
        : '-',
      el.repaysAggregatedAmount
        ? addThousandsSeparators(toPrecision(baseToDisplay(el.repaysAggregatedAmount || '0', 18), 0))
        : '-',
      el.interestRatePerSecond ? feeToInterestRate(el.interestRatePerSecond) : '-',
    ]),
  ]

  downloadCSV(rows, csvName(`Asset list`))
}
