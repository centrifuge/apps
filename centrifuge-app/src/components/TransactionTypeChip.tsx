import { StatusChip, StatusChipProps } from '@centrifuge/fabric'
import * as React from 'react'
import { TransactionCardProps } from './TransactionCard'

type TransactionTypeProps = {
  type: TransactionCardProps['action']
}

const states: {
  [Key in TransactionCardProps['action']]: {
    label: string
    status: StatusChipProps['status']
  }
} = {
  PENDING_ORDER: {
    label: 'Pending order',
    status: 'default',
  },
  INVEST_ORDER_UPDATE: {
    label: 'Invest order update',
    status: 'default',
  },
  REDEEM_ORDER_UPDATE: {
    label: 'Redeem order update',
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
    label: 'Invest execution',
    status: 'default',
  },
  REDEEM_EXECUTION: {
    label: 'Redeem execution',
    status: 'default',
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
}

export function TransactionTypeChip({ type }: TransactionTypeProps) {
  if (!states[type]) {
    return null
  }

  return <StatusChip status={states[type].status}>{states[type].label}</StatusChip>
}
