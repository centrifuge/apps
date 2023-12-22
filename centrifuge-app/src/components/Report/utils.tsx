import { BorrowerTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { Text } from '@centrifuge/fabric'
import { copyToClipboard } from '../../utils/copyToClipboard'

const investorTransactionTypes: {
  [key in InvestorTransactionType]: (args: { trancheTokenSymbol: string; poolCurrencySymbol: string }) => string
} = {
  INVEST_ORDER_UPDATE: () => 'Investment order updated',
  REDEEM_ORDER_UPDATE: () => 'Redemption order updated',
  INVEST_ORDER_CANCEL: () => 'Investment order cancelled',
  REDEEM_ORDER_CANCEL: () => 'Redemption order cancelled',
  INVEST_EXECUTION: () => 'Investment executed',
  REDEEM_EXECUTION: () => 'Redemption executed',
  TRANSFER_IN: ({ trancheTokenSymbol }) => `Deposited ${trancheTokenSymbol}`,
  TRANSFER_OUT: ({ trancheTokenSymbol }) => `Withdrawn ${trancheTokenSymbol}`,
  INVEST_COLLECT: ({ trancheTokenSymbol }) => `${trancheTokenSymbol} received in wallet`,
  REDEEM_COLLECT: ({ poolCurrencySymbol }) => `${poolCurrencySymbol} received in wallet`,
}

export function formatInvestorTransactionsType({
  type,
  trancheTokenSymbol,
  poolCurrencySymbol,
  currencyAmount,
}: {
  type: InvestorTransactionType
  trancheTokenSymbol: string
  poolCurrencySymbol: string
  currencyAmount: number | null
}) {
  if (!investorTransactionTypes[type]) {
    console.warn(`Type '${type}' is not assignable to type 'InvestorTransactionType'`)
    return type
  }

  if (type === 'INVEST_ORDER_UPDATE' && currencyAmount === 0) {
    return investorTransactionTypes['INVEST_ORDER_CANCEL']({ poolCurrencySymbol, trancheTokenSymbol })
  }

  if (type === 'REDEEM_ORDER_UPDATE' && currencyAmount === 0) {
    return investorTransactionTypes['REDEEM_ORDER_CANCEL']({ poolCurrencySymbol, trancheTokenSymbol })
  }

  return investorTransactionTypes[type]({ poolCurrencySymbol, trancheTokenSymbol })
}

const borrowerTransactionTypes: {
  [key in BorrowerTransactionType]: string
} = {
  CREATED: 'Created',
  PRICED: 'Priced',
  BORROWED: 'Financed',
  REPAID: 'Repaid',
  CLOSED: 'Closed',
}

export function formatBorrowerTransactionsType(type: BorrowerTransactionType) {
  if (!borrowerTransactionTypes[type]) {
    console.warn(`Type '${type}' is not assignable to type 'BorrowerTransactionType'`)
    return type
  }

  return borrowerTransactionTypes[type]
}

export function formatTransactionsType({
  type,
  trancheTokenSymbol,
  poolCurrencySymbol,
  currencyAmount,
}: {
  type: InvestorTransactionType | BorrowerTransactionType
  trancheTokenSymbol: string
  poolCurrencySymbol: string
  currencyAmount: number | null
}) {
  if (isBorrowerType(type)) {
    return formatBorrowerTransactionsType(type)
  }

  return formatInvestorTransactionsType({
    type,
    trancheTokenSymbol,
    poolCurrencySymbol,
    currencyAmount,
  })
}

function isBorrowerType(type: InvestorTransactionType | BorrowerTransactionType): type is BorrowerTransactionType {
  return ['CREATED', 'PRICED', 'BORROWED', 'REPAID', 'CLOSED'].includes(type)
}

export function truncate(text: string) {
  const first = text.slice(0, 5)
  const last = text.slice(-5)

  return `${first}...${last}`
}

export function copyable(text: string) {
  return (
    <Text
      style={{
        cursor: 'copy',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      }}
      onClick={() => copyToClipboard(text)}
    >
      {truncate(text)}
    </Text>
  )
}
