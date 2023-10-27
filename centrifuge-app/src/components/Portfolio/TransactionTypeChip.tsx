import { BorrowerTransactionType, InvestorTransactionType } from '@centrifuge/centrifuge-js'
import { StatusChip, StatusChipProps } from '@centrifuge/fabric'
import * as React from 'react'

type TransactionTypeProps = {
  type: InvestorTransactionType | BorrowerTransactionType
}

const states: {
  [Key in InvestorTransactionType | BorrowerTransactionType]: {
    label: string
    status: StatusChipProps['status']
  }
} = {
  INVEST_ORDER_UPDATE: {
    label: 'Invest order placed',
    status: 'default',
  },
  REDEEM_ORDER_UPDATE: {
    label: 'Redeem order placed',
    status: 'default',
  },
  INVEST_ORDER_CANCEL: {
    label: 'Invest order cancel',
    status: 'default',
  },
  REDEEM_ORDER_CANCEL: {
    label: 'Redeem order cancel',
    status: 'default',
  },
  INVEST_EXECUTION: {
    label: 'Invest executed',
    status: 'ok',
  },
  REDEEM_EXECUTION: {
    label: 'Redeem executed',
    status: 'info',
  },
  TRANSFER_IN: {
    label: 'Transfer in',
    status: 'default',
  },
  TRANSFER_OUT: {
    label: 'Transfer out',
    status: 'default',
  },
  INVEST_COLLECT: {
    label: 'Invest collect',
    status: 'default',
  },
  REDEEM_COLLECT: {
    label: 'Redeem collect',
    status: 'default',
  },
  CREATED: {
    label: 'Created',
    status: 'default',
  },
  BORROWED: {
    label: 'Borrowed',
    status: 'default',
  },
  REPAID: {
    label: 'Repaid',
    status: 'default',
  },
  CLOSED: {
    label: 'Closed',
    status: 'default',
  },
  PRICED: {
    label: 'Priced',
    status: 'default',
  },
}

export function TransactionTypeChip({ type }: TransactionTypeProps) {
  if (!states[type]) {
    return null
  }

  return <StatusChip status={states[type].status}>{states[type].label}</StatusChip>
}
