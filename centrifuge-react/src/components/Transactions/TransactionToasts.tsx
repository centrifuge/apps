import { AnchorButton, IconExternalLink, Stack, Toast, ToastStatus } from '@centrifuge/fabric'
import * as React from 'react'
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

const TOAST_DURATION = 10000

type TransactionToastsProps = {
  subscanUrl?: string
}

export function TransactionToasts({ subscanUrl }: TransactionToastsProps) {
  const { transactions, updateTransaction } = useTransactions()

  const dismiss = (txId: string) => () => updateTransaction(txId, { dismissed: true })

  return (
    <Stack width={330} gap={2} position="fixed" top={64} right={1} zIndex="overlay">
      {transactions
        .filter((tx) => !tx.dismissed && !['creating', 'unconfirmed'].includes(tx.status))
        .map((tx) => (
          <Toast
            label={tx.title}
            sublabel={(tx.status === 'failed' && tx.failedReason) || toastSublabel[tx.status]}
            status={toastStatus[tx.status]}
            onDismiss={dismiss(tx.id)}
            onStatusChange={(newStatus) => {
              if (['ok'].includes(newStatus)) {
                setTimeout(dismiss(tx.id), TOAST_DURATION)
              }
            }}
            action={
              tx.hash ? (
                <AnchorButton
                  variant="tertiary"
                  target="_blank"
                  href={new URL(`/extrinsic/${tx.hash}`, subscanUrl).toString()}
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
