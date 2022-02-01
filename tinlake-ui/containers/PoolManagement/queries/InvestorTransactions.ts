import BN from 'bn.js'
import { csvName } from '.'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
import { calculateCostInUsd, getAllTransactions, getAllTransfers } from './util'

const tokenSymbolIsJunior = (symbol: string) => symbol.slice(symbol.length - 3) === 'TIN'

export async function investorTransactions({ poolId }: { poolId: string; poolData: PoolData }) {
  const transactions = await getAllTransactions(poolId)
  const transfers = await getAllTransfers(poolId)

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
    transactionCost: 'Transaction Cost (USD)',
  }

  const date = (timestamp: string) => new Date(parseInt(timestamp, 10) * 1000)
  const formatDate = (timestamp: string) =>
    `${date(timestamp).toISOString().substr(0, 10)} ${date(timestamp).toUTCString().substr(17)}`

  const rows: string[][] = [
    [...Object.keys(headers).map((key: string) => headers[key])],
    ...transactions.map((el: any) => [
      el.timestamp ? formatDate(el.timestamp) : '-',
      el.pool ? el.pool.shortName : '-',
      el.owner ? el.owner.id : '-',
      el.type,
      el.token.symbol,
      el.currencyAmount / 10 ** 18,
      el.newBalance / 10 ** 18,
      el.tokenPrice / 10 ** 27,
      el.transaction,
      el.gasPrice / 10 ** 9,
      el.gasUsed,
      calculateCostInUsd(el.gasPrice, el.gasUsed, el.timestamp),
    ]),
    ...transfers.map((transfer: any) => [
      formatDate(transfer.timestamp),
      transfer.pool ? transfer.pool.shortName : '-',
      transfer.to ? transfer.to : '-',
      'TRANSFER_IN',
      transfer.token ? transfer.token.symbol : '-',
      new BN(transfer.amount)
        .mul(
          new BN(
            tokenSymbolIsJunior(transfer.token.symbol) ? transfer.pool.juniorTokenPrice : transfer.pool.seniorTokenPrice
          )
        )
        .div(new BN(10).pow(new BN(27 + 18)))
        .toNumber(),
      '-',
      new BN(
        tokenSymbolIsJunior(transfer.token.symbol) ? transfer.pool.juniorTokenPrice : transfer.pool.seniorTokenPrice
      )
        .div(new BN(10).pow(new BN(27 - 8)))
        .toNumber() /
        10 ** 8,
      transfer.transaction,
      transfer.gasPrice / 10 ** 9,
      transfer.gasUsed,
      calculateCostInUsd(transfer.gasPrice, transfer.gasUsed, transfer.timestamp),
    ]),
    ...transfers.map((transfer: any) => [
      formatDate(transfer.timestamp),
      transfer.pool ? transfer.pool.shortName : '-',
      transfer.from ? transfer.from : '-',
      'TRANSFER_OUT',
      transfer.token ? transfer.token.symbol : '-',
      new BN(transfer.amount)
        .mul(
          new BN(
            tokenSymbolIsJunior(transfer.token.symbol) ? transfer.pool.juniorTokenPrice : transfer.pool.seniorTokenPrice
          )
        )
        .div(new BN(10).pow(new BN(27 + 18)))
        .toNumber(),
      '-',
      new BN(
        tokenSymbolIsJunior(transfer.token.symbol) ? transfer.pool.juniorTokenPrice : transfer.pool.seniorTokenPrice
      )
        .div(new BN(10).pow(new BN(27 - 8)))
        .toNumber() /
        10 ** 8,
      transfer.transaction,
      transfer.gasPrice / 10 ** 9,
      transfer.gasUsed,
      calculateCostInUsd(transfer.gasPrice, transfer.gasUsed, transfer.timestamp),
    ]),
  ]

  const sorted = rows.sort((a: string[], b: string[]) => {
    return new Date(a[0]).getTime() - new Date(b[0]).getTime()
  })

  downloadCSV(sorted, csvName(`Investor Transaction List`))

  return true
}
