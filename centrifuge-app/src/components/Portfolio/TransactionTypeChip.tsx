import { BorrowerTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { formatTransactionsType } from '../Report/utils'

type TransactionTypeProps = {
  type: InvestorTransactionType | BorrowerTransactionType
  trancheTokenSymbol: string
  poolCurrencySymbol: string
  currencyAmount: number | null
}

const status = {
  INVEST_ORDER_UPDATE: 'default',
  REDEEM_ORDER_UPDATE: 'default',
  INVEST_ORDER_CANCEL: 'default',
  REDEEM_ORDER_CANCEL: 'default',
  INVEST_EXECUTION: 'ok',
  REDEEM_EXECUTION: 'info',
  TRANSFER_IN: 'default',
  TRANSFER_OUT: 'default',
  INVEST_COLLECT: 'default',
  REDEEM_COLLECT: 'default',
  INVEST_LP_COLLECT: 'default',
  REDEEM_LP_COLLECT: 'default',
  CREATED: 'default',
  BORROWED: 'default',
  REPAID: 'default',
  CLOSED: 'default',
  PRICED: 'default',
} as const

export function TransactionTypeChip(props: TransactionTypeProps) {
  const label = formatTransactionsType(props)

  return <StatusChip status={status[props.type]}>{label}</StatusChip>
}
