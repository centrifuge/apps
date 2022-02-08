import { AnchorButton, IconExternalLink, Stack, Toast, ToastStatus } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { useTransactions } from './TransactionsProvider'

const toastStatus: { [key: string]: ToastStatus } = {
  creating: 'pending',
  unconfirmed: 'pending',
  pending: 'pending',
  succeeded: 'ok',
  failed: 'critical',
}

const toastSublabel = {
  creating: 'Creating transaction',
  unconfirmed: 'Signing transaction',
  pending: 'Transaction pending',
  succeeded: 'Transaction successful',
  failed: 'Transaction failed',
}

export const TransactionToasts: React.FC = () => {
  const { transactions, updateTransaction } = useTransactions()
  const {
    sizes: { navBarHeight, navBarHeightMobile },
  } = useTheme()
  return (
    <Stack
      width={330}
      gap={2}
      position="fixed"
      top={[navBarHeightMobile, navBarHeightMobile, navBarHeight]}
      right={1}
      zIndex={10}
    >
      {transactions
        .filter((tx) => !tx.dismissed)
        .map((tx) => (
          <Toast
            label={tx.title}
            sublabel={(tx.status === 'failed' && tx.failedReason) || toastSublabel[tx.status]}
            status={toastStatus[tx.status]}
            onDismiss={() => updateTransaction(tx.id, { dismissed: true })}
            action={
              tx.hash ? (
                <AnchorButton
                  variant="text"
                  target="_blank"
                  href={`${process.env.REACT_APP_SUBSCAN_URL}${tx.hash}`}
                  icon={IconExternalLink}
                />
              ) : undefined
            }
            key={tx.id}
          />
        ))}
    </Stack>
  )
}
