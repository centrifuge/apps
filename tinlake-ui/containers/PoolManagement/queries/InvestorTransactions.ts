import BN from 'bn.js'
import { aggregateByYear, calculateFIFOCapitalGains, Operation } from 'fifo-capital-gains-js'
import gql from 'graphql-tag'
import { csvName } from '.'
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

function onlyUnique(value: any, index: number, self: any) {
  return self.indexOf(value) === index
}

const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)
const calculateInterestAccrued = (executions: any[], symbol: string, tokenPriceLastDay: number) => {
  if (executions.length === 0) return 0

  const operations: Operation[] = executions.map((result) => {
    return {
      amount: new BN(result.currencyAmount).div(new BN(10).pow(new BN(18))).toNumber(),
      date: date(result.timestamp),
      price: new BN(result.tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
      symbol: result.symbol,
      type: result.type === 'INVEST_EXECUTION' ? 'BUY' : 'SELL',
    }
  })
  const lastBalance = operations.reduce((last: number, operation: Operation) => {
    if (operation.type === 'BUY') return last + operation.amount
    else return last - operation.amount
  }, 0)

  const operationsWithAssumedYearEndSale =
    lastBalance < 0
      ? operations
      : [
          ...operations,
          {
            symbol,
            amount: lastBalance,
            date: new Date('12/30/2021'),
            price: tokenPriceLastDay,
            type: 'SELL',
          } as Operation,
        ]

  console.log(operationsWithAssumedYearEndSale)

  try {
    return aggregateByYear(calculateFIFOCapitalGains(operationsWithAssumedYearEndSale))
  } catch (e) {
    return 0
  }
}

export async function investorTransactions({ poolId }: { poolId: string; poolData: PoolData }) {
  let start = 0
  const limit = 1000

  const results: any[] = []
  let blockHash: string | null = null
  let blockNumber: number | null = null

  // subgraph only returns 1000 entries, fetch until no more entries are returned
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: any = await fetch(poolId, start, limit, blockHash)

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

  const executions = results.filter(
    (result) => result.type === 'INVEST_EXECUTION' || result.type === 'REDEEM_EXECUTION'
  )
  const symbols = executions.map((result) => result.symbol).filter(onlyUnique)
  const investors = executions.map((result) => result.owner.id).filter(onlyUnique)

  let rows: any = [['ETH account', 'Token', 'Interest accrued', 'Transaction fees paid']]
  symbols.forEach((symbol) => {
    investors.forEach((investor) => {
      const executionsBySymbolAndInvestor = executions.filter(
        (result) => result.symbol === symbol && result.owner.id === investor
      )
      console.log(`${symbol}: ${investor}`)
      const interestAccrued: any = calculateInterestAccrued(executionsBySymbolAndInvestor, symbol, 1.1)
      rows.push([investor, symbol, interestAccrued['2021'], '0'])
    })
  })

  downloadCSV(rows, csvName(`Tax Report 2021`))

  return true
}
