import { AssetTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { formatTransactionsType } from '../Report/utils'

type TransactionTypeProps = {
  type: InvestorTransactionType | AssetTransactionType
  trancheTokenSymbol: string
  poolCurrencySymbol: string
  currencyAmount: number | null
}

export function TransactionTypeChip(props: TransactionTypeProps) {
  const label = formatTransactionsType(props)

  return <Text variant="body3">{label}</Text>
}
