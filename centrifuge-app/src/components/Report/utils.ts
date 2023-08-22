import { BorrowerTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'

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
