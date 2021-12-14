import gql from 'graphql-tag'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from '../DataQuery/queries'

const fetch = async (owner: string, skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
      {
      investorTransactions(where: {owner: ${`"${owner}"`} }, orderBy: timestamp, orderDirection: desc, first: ${first}, skip: ${skip} ${
    blockHash ? `, block: { hash: "${blockHash}" }` : ''
  }) {
        pool {
          shortName
        }
        type
        symbol
        currencyAmount
        newBalance
        tokenPrice
        transaction
        owner {
          id
        }
        timestamp
        gasPrice
        gasUsed
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

export async function investorTransactions(owner: string) {
  let start = 0
  const limit = 1000

  const results: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // subgraph only returns 1000 entries, fetch until no more entries are returned
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetch(owner, start, limit, blockHash)

    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    results.push(...response.investorTransactions)
    if (response.investorTransactions.length < limit) {
      break
    }
    start += limit
  }

  const headers: { [key: string]: string } = {
    timestamp: 'Date',
    pool: 'Pool',
    owner: 'Account',
    type: 'Transaction Type',
    symbol: 'Symbol',
    currencyAmount: 'Currency Amount',
    newBalance: 'New Balance',
    tokenPrice: 'Token Price',
    transaction: 'Transaction Hash',
    gasPrice: 'Gas Price',
    gasUsed: 'Gas Used',
  }

  const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)
  const formatDate = (timestamp: string) =>
    `${date(timestamp).toISOString().substr(0, 10)} ${date(timestamp).toUTCString().substr(17)}`

  const rows: string[][] = [
    [...Object.keys(headers).map((key: string) => headers[key])],
    ...results.map((el: any) => [
      el.timestamp ? formatDate(el.timestamp) : '-',
      el.pool ? el.pool.shortName : '-',
      el.owner ? el.owner.id : '-',
      ...Object.keys(headers)
        .filter((item: any) => !Object.keys(headers).slice(0, 3).includes(item))
        .map((item: any) => {
          if (['currencyAmount', 'newBalance'].includes(item)) {
            return el[item] ? el[item] / 10 ** 18 : '-'
          } else if (item === 'tokenPrice') {
            return el[item] ? el[item] / 10 ** 27 : '-'
          } else if (item === 'gasPrice') {
            return el[item] ? el[item] / 10 ** 9 : '-'
          }
          return el[item] ? el[item] : '-'
        }),
    ]),
  ]

  downloadCSV(rows, csvName(`Investor Transaction List`))
}
