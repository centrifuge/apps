import BN from 'bn.js'
import { aggregateByYear, calculateFIFOCapitalGains, Operation } from 'fifo-capital-gains-js'
import gql from 'graphql-tag'
import { csvName } from '.'
import Apollo from '../../../services/apollo'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
const rawEthPrices = require('./eth_prices.json')

const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)
const formatDateOnly = (date: Date) => date.toISOString().substr(0, 10)
const e27 = new BN(10).pow(new BN(27))

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
        tokenAmount
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
    return balance - amount
  }, 0)
}

const calculateRealizedCapitalGains = (executions: any[], investor: string, yearStart: Date) => {
  if (executions.length === 0) return 0

  let totalBought = 0
  let largeAdjustment = false
  const operations: Operation[] = executions.map((execution) => {
    let tokenAmount =
      execution.type === 'INVEST_EXECUTION'
        ? new BN(execution.tokenAmount).div(new BN(10).pow(new BN(18))).toNumber()
        : new BN(execution.currencyAmount)
            .mul(e27)
            .div(new BN(execution.tokenPrice))
            .div(new BN(10).pow(new BN(18)))
            .toNumber()

    if (execution.type === 'INVEST_EXECUTION') {
      totalBought += tokenAmount
    }

    if (execution.type === 'REDEEM_EXECUTION') {
      if (totalBought - tokenAmount < 0) {
        // This ensures that we don't try to sell more than we buy, which can be caused by issues with token prices being slightly off
        console.log(`Adjusting ${tokenAmount} to ${totalBought}: ${tokenAmount - totalBought}`)
        if (tokenAmount - totalBought > 5) largeAdjustment = true
        tokenAmount = totalBought
        totalBought = 0
      } else {
        totalBought = totalBought - tokenAmount
      }
    }

    return {
      amount: tokenAmount,
      date: date(execution.timestamp),
      price: new BN(execution.tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
      symbol: execution.symbol,
      type: execution.type === 'INVEST_EXECUTION' ? 'BUY' : 'SELL',
    }
  })

  if (largeAdjustment) {
    console.log(investor)
    console.log(operations)
    console.log('\n')
  }

  try {
    // if (investor === '0x143a9422b6c78e78a898dd1f9d25b2a42ae211e5') {
    //   console.log(operations)
    //   const newops: Operation[] = [
    //     { amount: 4963, date: new Date('2021-02-26T09:09:12.000Z'), price: 100739, symbol: 'NS2DRP', type: 'BUY' },
    //     { amount: 9937, date: new Date('2021-02-15T09:02:14.000Z'), price: 1006196, symbol: 'NS2DRP', type: 'BUY' },
    //     { amount: 14902, date: new Date('2021-06-27T15:11:45.000Z'), price: 1021908, symbol: 'NS2DRP', type: 'SELL' },
    //   ]
    //   const capGains = calculateFIFOCapitalGains(operations)
    //   console.log(JSON.stringify(capGains))
    // }
    return aggregateByYear(calculateFIFOCapitalGains(operations))
  } catch (e) {
    console.error(e)
    const year = yearStart.getFullYear()
    return { [year]: 0 }
  }
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

  let totalBought = 0
  const operations: Operation[] = executions.map((execution) => {
    let tokenAmount =
      execution.type === 'INVEST_EXECUTION'
        ? new BN(execution.tokenAmount).div(new BN(10).pow(new BN(18))).toNumber()
        : new BN(execution.currencyAmount)
            .mul(e27)
            .div(new BN(execution.tokenPrice))
            .div(new BN(10).pow(new BN(18)))
            .toNumber()

    if (execution.type === 'INVEST_EXECUTION') {
      totalBought += tokenAmount
    }

    if (execution.type === 'REDEEM_EXECUTION') {
      if (totalBought - tokenAmount < 0) {
        // This ensures that we don't try to sell more than we buy, which can be caused by issues with token prices being slightly off
        console.log(`Adjusting ${tokenAmount} to ${totalBought}: ${tokenAmount - totalBought}`)
        tokenAmount = totalBought
        totalBought = 0
      } else {
        totalBought = totalBought - tokenAmount
      }
    }

    return {
      amount: tokenAmount,
      date: date(execution.timestamp),
      price: new BN(execution.tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
      symbol: execution.symbol,
      type: execution.type === 'INVEST_EXECUTION' ? 'BUY' : 'SELL',
    }
  })

  const lastBalance = operations.reduce((last: number, operation: Operation) => {
    if (operation.type === 'BUY') return last + operation.amount
    return last - operation.amount
  }, 0)

  // Add a buy order on the first day of the year, with the balance at the start
  const operationsAggregratedYearStart =
    balanceOnFirstDay > 0
      ? [
          {
            symbol,
            amount: balanceOnFirstDay,
            date: yearStart,
            price: tokenPriceFirstDay,
            type: 'BUY',
          } as Operation,
          ...operations.filter((op) => op.date >= yearStart),
        ]
      : operations

  // Add a sell order at the end of the year, to assume everything was sold
  const operationsWithAssumedYearEndSale =
    lastBalance <= 0
      ? operationsAggregratedYearStart
      : [
          ...operationsAggregratedYearStart,
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
    console.error(e)
    const year = yearStart.getFullYear()
    return { [year]: 0 }
  }
}

async function getAllTokenPrices(poolId: string) {
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

async function getAllTransactions(poolId: string) {
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

  return transactions.sort((a: any, b: any) => {
    return date(a.timestamp).getTime() - date(b.timestamp).getTime()
  })
}

async function taxReportByYear({ poolId, taxYear }: { poolId: string; poolData: PoolData; taxYear: number }) {
  const yearStart = new Date(taxYear, 0, 1)
  const yearEnd = new Date(taxYear, 11, 31)

  const transactions = await getAllTransactions(poolId)
  const symbols = transactions.map((tx) => tx.symbol).filter(onlyUnique)

  const tokenPrices = await getAllTokenPrices(poolId)
  const tokenPricesByDay = tokenPrices.reduce((prev: any, result: any) => {
    return {
      ...prev,
      ...{
        [formatDateOnly(date(result.day.id)).toString()]: {
          senior: new BN(result.seniorTokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
          junior: new BN(result.juniorTokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
        },
      },
    }
  }, {})
  const tokenPricesYearStart =
    formatDateOnly(yearStart) in tokenPricesByDay && tokenPricesByDay[formatDateOnly(yearStart)] !== '0'
      ? tokenPricesByDay[formatDateOnly(yearStart)]
      : { senior: 1.0, junior: 1.0 }
  console.log(tokenPricesByDay)
  console.log(formatDateOnly(yearEnd))
  const tokenPricesYearEnd =
    formatDateOnly(yearEnd) in tokenPricesByDay && tokenPricesByDay[formatDateOnly(yearEnd)] !== '0'
      ? tokenPricesByDay[formatDateOnly(yearEnd)]
      : Object.values(tokenPricesByDay).length > 0
      ? Object.values(tokenPricesByDay)[Object.values(tokenPricesByDay).length - 1] // TODO: this should not take the last element
      : { senior: 1.0, junior: 1.0 }

  console.log(`DROP token price started at ${tokenPricesYearStart.senior} and ended at ${tokenPricesYearEnd.senior}`)
  console.log(`TIN token price started at ${tokenPricesYearStart.junior} and ended at ${tokenPricesYearEnd.junior}`)

  // Get all investors who had a non-zero balance before year end
  const investors = transactions
    .filter((tx) => tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')
    .filter((result) => date(result.timestamp) <= yearEnd)
    .map((tx) => tx.owner.id)
    .filter(onlyUnique)

  const rows: any = [['ETH account', 'Token', 'Realized capital gains', 'Interest accrued', 'Transaction fees paid']]
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

      const realizedCapitalGains: any = calculateRealizedCapitalGains(executions, investor, yearStart)
      const interestAccrued: any = calculateInterestAccrued(
        executions,
        symbol,
        tokenPricesYearStart['senior'], // TODO: get by symbol
        tokenPricesYearEnd['senior'], // TODO: get by symbol
        yearStart,
        yearEnd
      )
      const transactionFees = sumTransactionFees(orders)
      rows.push([investor, symbol, realizedCapitalGains['2021'] || 0, interestAccrued['2021'] || 0, transactionFees])
    })
  })

  downloadCSV(rows, csvName(`Tax Report ${taxYear}`))

  return true
}

export function taxReport2020({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return taxReportByYear({ poolId, poolData, taxYear: 2020 })
}

export function taxReport2021({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return taxReportByYear({ poolId, poolData, taxYear: 2021 })
}
