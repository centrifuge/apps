import gql from 'graphql-tag'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from './queries'

const fetch = async (skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
    {
      rewardBalances(where:{ links: [] }, first: ${first}, skip: ${skip} ${
    blockHash ? `, block: { hash: "${blockHash}" }` : ''
  }) {
        id
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

export async function unlinkedAddresses() {
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
    results.push(...response.rewardBalances)
    if (response.rewardBalances.length < limit) {
      break
    }
    start += limit
  }

  const headers = ['Address']
  const rows: string[][] = [headers, ...results.map((el: any) => [el.id])]

  downloadCSV(rows, csvName(`Unlinked addresses`))
}
