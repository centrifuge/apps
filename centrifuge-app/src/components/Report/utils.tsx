import { PoolFeeTransactionType } from '@centrifuge/centrifuge-js'
import { AssetTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { Text } from '@centrifuge/fabric'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { truncate } from '../../utils/web3'

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
  INVEST_LP_COLLECT: ({ trancheTokenSymbol }) => `${trancheTokenSymbol} received in wallet`,
  REDEEM_LP_COLLECT: ({ poolCurrencySymbol }) => `${poolCurrencySymbol} received in wallet`,
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

const feeTransactionTypes: {
  [key in PoolFeeTransactionType]: () => string
} = {
  PROPOSED: () => 'Proposed',
  ADDED: () => 'Added',
  REMOVED: () => 'Removed',
  CHARGED: () => 'Direct charge made',
  UNCHARGED: () => 'Direct charge cancelled',
  ACCRUED: () => 'Accrued',
  PAID: () => 'Paid',
}

export function formatPoolFeeTransactionType(type: PoolFeeTransactionType) {
  if (!feeTransactionTypes[type]) {
    console.warn(`Type '${type}' is not assignable to type 'PoolFeeTransactionType'`)
    return type
  }

  return feeTransactionTypes[type]()
}

const assetTransactionTypes: {
  [key in AssetTransactionType]: string
} = {
  CREATED: 'Created',
  PRICED: 'Priced',
  BORROWED: 'Financed',
  REPAID: 'Repaid',
  CLOSED: 'Closed',
}

export function formatAssetTransactionType(type: AssetTransactionType) {
  if (!assetTransactionTypes[type]) {
    console.warn(`Type '${type}' is not assignable to type 'AssetTransactionType'`)
    return type
  }

  return assetTransactionTypes[type]
}

export function formatTransactionsType({
  type,
  trancheTokenSymbol,
  poolCurrencySymbol,
  currencyAmount,
}: {
  type: InvestorTransactionType | AssetTransactionType
  trancheTokenSymbol: string
  poolCurrencySymbol: string
  currencyAmount: number | null
}) {
  if (isAssetType(type)) {
    return formatAssetTransactionType(type)
  }

  return formatInvestorTransactionsType({
    type,
    trancheTokenSymbol,
    poolCurrencySymbol,
    currencyAmount,
  })
}

function isAssetType(type: InvestorTransactionType | AssetTransactionType): type is AssetTransactionType {
  return ['CREATED', 'PRICED', 'BORROWED', 'REPAID', 'CLOSED'].includes(type)
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
