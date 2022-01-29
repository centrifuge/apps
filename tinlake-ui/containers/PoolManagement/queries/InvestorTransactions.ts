import { ethers } from 'ethers'
import gql from 'graphql-tag'
import { csvName } from '.'
import config from '../../../config'
import Apollo from '../../../services/apollo'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'

const fetch = async (poolId: string, skip: number, first: number, blockHash: string | null): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
      {
      investorTransactions(where: {pool: ${`"${poolId.toLowerCase()}"`} }, orderBy: timestamp, orderDirection: desc, first: ${first}, skip: ${skip} ${
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

export async function getAllTransactions(poolId: string) {
  let start = 0
  const limit = 1000

  const transactions: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetch(poolId, start, limit, blockHash)

    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    transactions.push(...response.investorTransactions)
    if (response.investorTransactions.length < limit) {
      break
    }
    start += limit
  }

  return transactions
}

const fetchERC20Transfers = async (
  poolId: string,
  skip: number,
  first: number,
  blockHash: string | null
): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
      {
        erc20Transfers(where: {pool: ${`"${poolId.toLowerCase()}"`} }, first: ${first}, skip: ${skip} ${
    blockHash ? `, block: { hash: "${blockHash}" }` : ''
  }) {
        id
        transaction
        from
        to
        amount
        pool {
          shortName
          addresses {
            seniorTranche
            juniorTranche
          }
        }
        token {
          symbol
        }
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

export async function getAllTransfers(poolId: string) {
  let start = 0
  const limit = 1000

  const transactions: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetchERC20Transfers(poolId, start, limit, blockHash)

    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    transactions.push(...response.erc20Transfers)
    if (response.erc20Transfers.length < limit) {
      break
    }
    start += limit
  }

  return transactions
}

export async function investorTransactions({ poolId }: { poolId: string; poolData: PoolData }) {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

  const transactions = await getAllTransactions(poolId)
  const transfers = (
    await Promise.all(
      (
        await getAllTransfers(poolId)
      )
        .map((transfer: any) => {
          return {
            ...transfer,
            isContract:
              transfer.from === '0x0000000000000000000000000000000000000000' ||
              Object.values(transfer.pool.addresses).includes(transfer.from) ||
              Object.values(transfer.pool.addresses).includes(transfer.to),
          }
        })
        .filter((transfer) => !transfer.isContract)
        .map(async (transfer: any) => {
          const codeFrom = await provider.getCode(transfer.from)
          const codeTo = await provider.getCode(transfer.to)
          const block = await provider.getBlock(Number(transfer.id.split('-')[0]))
          return { ...transfer, codeFrom, codeTo, timestamp: block.timestamp }
        })
    )
  ).filter((transfer: any) => transfer.codeFrom === '0x' && transfer.codeTo === '0x')

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

  console.log(transfers)

  const rows: string[][] = [
    [...Object.keys(headers).map((key: string) => headers[key])],
    ...transactions.map((el: any) => [
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
    ...transfers.map((transfer: any) => [
      [
        formatDate(transfer.timestamp),
        transfer.pool ? transfer.pool.shortName : '-',
        transfer.to ? transfer.to : '-',
        'TRANSFER_IN',
        transfer.token ? transfer.token.symbol : '-',
        transfer.amount,
        '-',
        '-',
        transfer.transaction,
        '-',
        '-',
      ],
      [
        formatDate(transfer.timestamp),
        transfer.pool ? transfer.pool.shortName : '-',
        transfer.from ? transfer.from : '-',
        'TRANSFER_OUT',
        transfer.token ? transfer.token.symbol : '-',
        transfer.amount,
        '-',
        '-',
        transfer.transaction,
        '-',
        '-',
      ],
    ]),
  ]

  downloadCSV(rows, csvName(`Investor Transaction List`))

  return true
}
