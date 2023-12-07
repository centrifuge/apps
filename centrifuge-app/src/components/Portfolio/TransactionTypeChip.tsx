import { BorrowerTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js'
import { StatusChip, StatusChipProps } from '@centrifuge/fabric'
import * as React from 'react'

type LabelArgs = {
  poolCurrencySymbol?: string
  trancheTokenSymbol?: string
}

type TransactionTypeProps = {
  type: InvestorTransactionType | BorrowerTransactionType
  labelArgs?: LabelArgs
}

const states: {
  [Key in InvestorTransactionType | BorrowerTransactionType]: {
    label: (args: LabelArgs) => string
    status: StatusChipProps['status']
  }
} = {
  INVEST_ORDER_UPDATE: {
    label: () => 'Investment order updated',
    status: 'default',
  },
  REDEEM_ORDER_UPDATE: {
    label: () => 'Redemption order updated',
    status: 'default',
  },
  INVEST_ORDER_CANCEL: {
    label: () => 'Investment order cancelled',
    status: 'default',
  },
  REDEEM_ORDER_CANCEL: {
    label: () => 'Redemption order cancelled',
    status: 'default',
  },
  INVEST_EXECUTION: {
    label: () => 'Investment executed',
    status: 'ok',
  },
  REDEEM_EXECUTION: {
    label: () => 'Redemption executed',
    status: 'info',
  },
  TRANSFER_IN: {
    label: ({ trancheTokenSymbol }) => `Deposited ${trancheTokenSymbol}`,
    status: 'ok',
  },
  TRANSFER_OUT: {
    label: ({ trancheTokenSymbol }) => `Withdrawn ${trancheTokenSymbol}`,
    status: 'info',
  },
  INVEST_COLLECT: {
    label: ({ trancheTokenSymbol }) => `${trancheTokenSymbol} received in wallet`,
    status: 'ok',
  },
  REDEEM_COLLECT: {
    label: ({ poolCurrencySymbol }) => `${poolCurrencySymbol} received in wallet`,
    status: 'ok',
  },
  CREATED: {
    label: () => 'Created',
    status: 'default',
  },
  BORROWED: {
    label: () => 'Borrowed',
    status: 'default',
  },
  REPAID: {
    label: () => 'Repaid',
    status: 'default',
  },
  CLOSED: {
    label: () => 'Closed',
    status: 'default',
  },
  PRICED: {
    label: () => 'Priced',
    status: 'default',
  },
}

export function TransactionTypeChip({ type, labelArgs }: TransactionTypeProps) {
  if (!states[type]) {
    throw new Error(`${states[type]} is not a valid transaction type}`)
  }

  return <StatusChip status={states[type].status}>{states[type].label(labelArgs ?? {})}</StatusChip>
}
