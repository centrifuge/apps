import { CurrencyBalance, PoolFeeTransactionType } from '@centrifuge/centrifuge-js'
import { AssetTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { Text } from '@centrifuge/fabric'
import { AssetTransactionReport } from '@centrifuge/sdk'
import { BN } from 'bn.js'
import React from 'react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { truncate } from '../../utils/web3'
import { GroupBy } from './ReportContext'

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
  CASH_TRANSFER: 'Cash transfer',
  DEPOSIT_FROM_INVESTMENTS: 'Deposit from investments',
  WITHDRAWAL_FOR_REDEMPTIONS: 'Withdrawal for redemptions',
  WITHDRAWAL_FOR_FEES: 'Withdrawal for fees',
  INCREASE_DEBT: 'Correction (increase)',
  DECREASE_DEBT: 'Correction (decrease)',
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

export function convertCSV(values: any[], columnConfig: any[]) {
  return Object.fromEntries(
    columnConfig.map((col, index) => {
      const currentValue = values[index]

      // Check if the value is a React element
      if (React.isValidElement(currentValue)) {
        const element = currentValue as React.ReactElement
        const textValue = element.props?.children[1]?.props?.children[1] ?? 'Default Text'
        return [col.header, `"${textValue}"`]
      } else {
        // For non-React element types, directly return the value
        // Ensure the value is converted to a string if it's not already
        return [col.header, `"${String(currentValue)}"`]
      }
    })
  )
}

export const getColumnHeader = (timestamp: string, groupBy: string) => {
  if (groupBy === 'day' || groupBy === 'daily') {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } else if (groupBy === 'month') {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  } else if (groupBy === 'quarter') {
    const date = new Date(timestamp)
    return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
  } else if (groupBy === 'year') {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
    })
  }
  return ''
}

export const getAdjustedDates = (
  groupBy?: GroupBy,
  startDate?: Date,
  endDate?: Date,
  poolCreatedAt?: Date
): [Date, Date] => {
  const today = new Date()
  today.setDate(today.getDate())
  today.setHours(0, 0, 0, 0)

  if (groupBy) {
    switch (groupBy) {
      case 'day': {
        const from = new Date(startDate ?? today)
        from.setHours(0, 0, 0, 0)
        const to = new Date(startDate ?? today)
        to.setDate(to.getDate() + 1)
        to.setHours(0, 0, 0, 0)
        return [from, to]
      }
      case 'daily': {
        const from = new Date(startDate ?? today)
        from.setHours(0, 0, 0, 0)
        const to = new Date(endDate ?? today)
        to.setDate(to.getDate() + 1)
        to.setHours(0, 0, 0, 0)
        return [from, to]
      }
      case 'quarter':
      case 'year': {
        const from = poolCreatedAt ? new Date(poolCreatedAt) : today
        return [from, today]
      }
      default: {
        const to = new Date(endDate ?? today)
        to.setDate(to.getDate() + 1)
        to.setHours(0, 0, 0, 0)
        return [new Date(startDate ?? today), to]
      }
    }
  }

  return [startDate ?? today, endDate ?? today]
}

type NetFlow = 'positive' | 'negative' | 'neutral'

export function getTransactionLabelAndAmount(transaction: AssetTransactionReport, activeAssetId?: string) {
  const { transactionType, amount, toAsset, interestAmount, principalAmount } = transaction

  let netFlow: NetFlow = 'neutral'
  if (activeAssetId) {
    const toAssetIdPart = toAsset?.id.split('-')[1]
    netFlow = activeAssetId === toAssetIdPart ? 'positive' : 'negative'
  }

  switch (transactionType) {
    case 'CASH_TRANSFER':
      return {
        label: 'Cash transfer from',
        amount,
        netFlow,
      }

    case 'DEPOSIT_FROM_INVESTMENTS':
      return {
        label: 'Deposit from investments into',
        amount,
        netFlow: 'positive',
      }

    case 'WITHDRAWAL_FOR_REDEMPTIONS':
      return {
        label: 'Withdrawal for redemptions',
        amount,
        netFlow: 'negative',
      }

    case 'WITHDRAWAL_FOR_FEES':
      return {
        label: 'Withdrawal for fees',
        amount,
        netFlow: 'negative',
      }

    case 'BORROWED':
      return {
        label: 'Purchase of',
        amount,
        netFlow,
      }

    case 'INCREASE_DEBT':
      return {
        label: 'Correction ↑ of',
        amount,
        netFlow: 'positive',
      }

    case 'DECREASE_DEBT':
      return {
        label: 'Correction ↓ of',
        amount,
        netFlow: 'negative',
      }

    case 'REPAID': {
      const interestBN = new BN(interestAmount || 0)
      const principalBN = new BN(principalAmount || 0)

      if (!interestBN.isZero() && !principalBN.isZero()) {
        return {
          label: 'Principal & interest payment',
          amount: new CurrencyBalance(principalBN.add(interestBN), principalAmount?.decimals ?? 0),
          netFlow,
        }
      }

      if (!interestBN.isZero() && principalBN.isZero()) {
        return {
          label: 'Interest payment from',
          amount: interestAmount,
          netFlow,
        }
      }

      return {
        label: 'Sale of',
        amount: principalAmount,
        netFlow,
        sublabel: 'settled into',
      }
    }

    default:
      return {
        label: 'Sale of',
        amount: principalAmount,
        netFlow,
        sublabel: 'settled into',
      }
  }
}
