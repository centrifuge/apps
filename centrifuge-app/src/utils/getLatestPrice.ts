import { BorrowerTransaction, CurrencyBalance } from '@centrifuge/centrifuge-js'

export const getLatestPrice = (
  oracleValue: CurrencyBalance,
  borrowerAssetTransactions: BorrowerTransaction[] | undefined,
  decimals: number
) => {
  if (!borrowerAssetTransactions) return null

  const latestSettlementPrice = borrowerAssetTransactions[borrowerAssetTransactions.length - 1]?.settlementPrice

  if (latestSettlementPrice && oracleValue.isZero()) {
    return new CurrencyBalance(latestSettlementPrice, decimals)
  }

  if (oracleValue.isZero()) {
    return null
  }

  return new CurrencyBalance(oracleValue, 18)
}
