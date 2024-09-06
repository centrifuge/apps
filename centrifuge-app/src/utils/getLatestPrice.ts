import { AssetTransaction, CurrencyBalance } from '@centrifuge/centrifuge-js'

export const getLatestPrice = (
  oracleValue: { value: CurrencyBalance; timestamp: number },
  borrowerAssetTransactions: AssetTransaction[] | undefined,
  decimals: number
): { value: CurrencyBalance; timestamp: number } => {
  if (!borrowerAssetTransactions || !borrowerAssetTransactions.length)
    return { value: new CurrencyBalance(0, decimals), timestamp: 0 }

  const latestTx = borrowerAssetTransactions[borrowerAssetTransactions.length - 1]

  if (latestTx.settlementPrice && oracleValue.value.isZero()) {
    return { value: new CurrencyBalance(latestTx.settlementPrice, decimals), timestamp: latestTx.timestamp.getTime() }
  }

  if (oracleValue.value.isZero()) {
    return { value: new CurrencyBalance(0, decimals), timestamp: 0 }
  }

  return oracleValue
}
