import { ethers } from 'ethers'
import gql from 'graphql-tag'
import config from '../../../config'
import Apollo from '../../../services/apollo'

const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)

const fetchTransactions = async (
  poolId: string,
  skip: number,
  first: number,
  blockHash: string | null
): Promise<any> => {
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
    const response: any = await fetchTransactions(poolId, start, limit, blockHash)

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

  const sorted = transactions.sort((a, b) => {
    return date(a.timestamp).getTime() - date(b.timestamp).getTime()
  })

  return sorted
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
          seniorTokenPrice
          juniorTokenPrice
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

export async function getAllTransfers(poolId: string): Promise<any[]> {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

  let start = 0
  const limit = 1000

  const transfers: any[] = []
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
    transfers.push(...response.erc20Transfers)
    if (response.erc20Transfers.length < limit) {
      break
    }
    start += limit
  }

  const nonContractTransfers = (
    await Promise.all(
      transfers
        .map((transfer: any) => {
          return {
            ...transfer,
            isContract:
              transfer.from === '0x0000000000000000000000000000000000000000' ||
              Object.values(transfer.pool.addresses).includes(transfer.from) ||
              Object.values(transfer.pool.addresses).includes(transfer.to),
          }
        })
        .filter((transfer: any) => !transfer.isContract)
        .map(async (transfer: any) => {
          const codeFrom = await provider.getCode(transfer.from)
          const codeTo = await provider.getCode(transfer.to)
          const block = await provider.getBlock(Number(transfer.id.split('-')[0]))
          return { ...transfer, codeFrom, codeTo, timestamp: block.timestamp }
        })
    )
  ).filter((transfer: any) => transfer.codeFrom === '0x' && transfer.codeTo === '0x')

  const sorted = nonContractTransfers.sort((a, b) => {
    return date(a.timestamp).getTime() - date(b.timestamp).getTime()
  })

  return sorted
}

const fetchTokenPrices = async (
  poolId: string,
  skip: number,
  first: number,
  blockHash: string | null
): Promise<any> => {
  return await Apollo.runCustomQuery(gql`
    {
      dailyPoolDatas(where: {pool: ${`"${poolId.toLowerCase()}"`} }, first: ${first}, skip: ${skip} ${
    blockHash ? `, block: { hash: "${blockHash}" }` : ''
  }) {
        day {
          id
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

export async function getAllTokenPrices(poolId: string) {
  let start = 0
  const limit = 1000

  const tokenPrices: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetchTokenPrices(poolId, start, limit, blockHash)

    if (blockHash === null) {
      blockHash = response._meta.block.hash
    }
    if (blockNumber === null) {
      blockNumber = response._meta.block.number
    }
    tokenPrices.push(...response.dailyPoolDatas)
    if (response.dailyPoolDatas.length < limit) {
      break
    }
    start += limit
  }

  return tokenPrices
}
