import BN from 'bn.js'
import { aggregateByYear, calculateFIFOCapitalGains, Operation } from 'fifo-capital-gains-js'
import gql from 'graphql-tag'
import { csvName } from '.'
import Apollo from '../../../services/apollo'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
const rawEthPrices = require('./eth_prices.json')

const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)
const formatDate = (date: Date) => `${date.toISOString().substr(0, 10)} ${date.toUTCString().substr(17)}`
const formatDateOnly = (date: Date) => date.toISOString().substr(0, 10)

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

type EthPrice = { Date: string; price: number }
const ethPrices = (rawEthPrices as EthPrice[]).reduce((prev: any, price: EthPrice) => {
  return { ...prev, ...{ [formatDateOnly(new Date(price.Date)).toString()]: price.price } }
}, {})

function onlyUnique(value: any, index: number, self: any) {
  return self.indexOf(value) === index
}

const sumTransactionFees = (orders: any[]) => {
  return orders.reduce((sum: number, order: any) => {
    const costInEth =
      new BN(order.gasUsed)
        .mul(new BN(order.gasPrice))
        .div(new BN(10).pow(new BN(12)))
        .toNumber() /
      10 ** 6
    const costInUsd = costInEth * ethPrices[formatDateOnly(date(order.timestamp))]
    return sum + costInUsd
  }, 0)
}

const getBalanceOnFirstDay = (executionsBeforeYearStart: any[]) => {
  return executionsBeforeYearStart.reduce((balance: number, result: any) => {
    const amount = new BN(result.currencyAmount).div(new BN(10).pow(new BN(18))).toNumber()
    if (result.type === 'INVEST_EXECUTION') return balance + amount
    else return balance - amount
  }, 0)
}

const calculateInterestAccrued = (
  executions: any[],
  symbol: string,
  tokenPriceFirstDay: number,
  tokenPriceLastDay: number,
  yearStart: Date,
  yearEnd: Date
) => {
  if (executions.length === 0) return 0
  const executionsBeforeYearStart = executions.filter((result) => date(result.timestamp) < yearStart)
  const balanceOnFirstDay = getBalanceOnFirstDay(executionsBeforeYearStart)

  // Add a buy order on the first day of the year, with the balance at the start
  const executionsAggregratedYearStart = [
    {
      symbol,
      amount: balanceOnFirstDay,
      date: yearStart,
      price: tokenPriceFirstDay,
      type: 'BUY',
    } as Operation,
    ...executions.filter((result) => date(result.timestamp) >= yearStart),
  ]

  const operations: Operation[] = executionsAggregratedYearStart.map((result) => {
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

  // Add a sell order at the end of the year, to assume everything was sold
  const operationsWithAssumedYearEndSale =
    lastBalance < 0
      ? operations
      : [
          ...operations,
          {
            symbol,
            amount: lastBalance,
            date: yearEnd,
            price: tokenPriceLastDay,
            type: 'SELL',
          } as Operation,
        ]
  try {
    return aggregateByYear(calculateFIFOCapitalGains(operationsWithAssumedYearEndSale))
  } catch (e) {
    return 0
  }
}

async function investorTransactionsByYear({
  poolId,
  taxYear,
}: {
  poolId: string
  poolData: PoolData
  taxYear: number
}) {
  const yearStart = new Date(taxYear, 0, 1)
  const yearEnd = new Date(taxYear, 11, 31)

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

  const symbols = transactions.map((tx) => tx.symbol).filter(onlyUnique)

  // Get all investors who had a non-zero balance before year end
  const investors = transactions
    .filter((tx) => tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')
    .filter((result) => date(result.timestamp) <= yearEnd)
    .map((tx) => tx.owner.id)
    .filter(onlyUnique)

  let rows: any = [['ETH account', 'Token', 'Interest accrued', 'Transaction fees paid']]
  symbols.forEach((symbol) => {
    investors.forEach((investor) => {
      // Get all the executions until the end of the year (including the years before, to get all buy ordres)
      const executions = transactions
        .filter((tx) => tx.symbol === symbol && tx.owner.id === investor)
        .filter((tx) => tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')
        .filter((tx) => date(tx.timestamp) <= yearEnd)

      // And get all relevant tx for fees
      // TODO: add collect tx
      const orders = transactions
        .filter((tx) => tx.symbol === symbol && tx.owner.id === investor)
        .filter((tx) => tx.type === 'INVEST_ORDER' || tx.type === 'REDEEM_ORDER')
        .filter((result) => date(result.timestamp) >= yearStart && date(result.timestamp) <= yearEnd)

      // console.log(`${symbol}: ${investor}`)
      const interestAccrued: any = calculateInterestAccrued(executions, symbol, 1.0, 1.1, yearStart, yearEnd)
      const transactionFees = sumTransactionFees(orders)
      rows.push([investor, symbol, interestAccrued['2021'], transactionFees])
    })
  })

  downloadCSV(rows, csvName(`Tax Report ${taxYear}`))

  return true
}

export function investorTransactions2020({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return investorTransactionsByYear({ poolId, poolData, taxYear: 2020 })
}

export function investorTransactions2021({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return investorTransactionsByYear({ poolId, poolData, taxYear: 2021 })
}
