import { Button, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageContainer } from '../components/PageContainer'
import { useCreateTransaction, useTransactions } from '../components/TransactionsProvider'

export const CollectionsPage: React.FC = () => {
  return (
    <PageContainer>
      <Card p={3}>
        <Stack gap={3}>
          <Text variant="heading1">Collections</Text>
          <TestTransaction />
        </Stack>
      </Card>
    </PageContainer>
  )
}

const TestTransaction: React.FC = () => {
  const { createTransaction, lastCreatedTransaction } = useCreateTransaction()
  const { transactions } = useTransactions()

  return (
    <Stack gap={3}>
      <div>
        <Button
          onClick={() =>
            createTransaction('Transfer', (api) =>
              api.tx.balances.transfer('5HGqAFfJYnsKXMaGYJrCtkrT5zTXsSTvQF73GXckqBwPosMs', 1)
            )
          }
          loading={lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false}
        >
          Do some transaction
        </Button>
      </div>
      <div>Transactions</div>
      {transactions.map((tx) => (
        <>
          <dl>
            <dt>Id:</dt>
            <dd>{tx.id}</dd>
            <dt>Status:</dt>
            <dd>{tx.status}</dd>
            <dt>Description:</dt>
            <dd>{tx.description}</dd>
          </dl>
        </>
      ))}
    </Stack>
  )
}
