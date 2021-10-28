import { Button, Grid, IconPlus, Shelf, Stack } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import * as React from 'react'
import { CollectionCard } from '../components/CollectionCard'
import { NavBar } from '../components/NavBar'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { useTransactions } from '../components/TransactionsProvider'
import { useBalance } from '../utils/useBalance'
import { useCreateTransaction } from '../utils/useCreateTransaction'
import { useTransactionFeeEstimate } from '../utils/useTransactionFeeEstimate'

export const CollectionsPage: React.FC = () => {
  return (
    <>
      <NavBar title="NFT Studio" />
      <PageContainer>
        <Stack gap={3}>
          <Shelf justifyContent="flex-end">
            <RouterLinkButton to="/collection/create" variant="text" icon={IconPlus}>
              Create Collection
            </RouterLinkButton>
          </Shelf>
          <Grid gap={[1, 2, 3]} minColumnWidth={['1fr', 440]} equalColumns>
            <CollectionCard />
            <CollectionCard />
            <CollectionCard />
            <CollectionCard />
            <CollectionCard />
            <CollectionCard />
          </Grid>
          <TestTransaction />
        </Stack>
      </PageContainer>
    </>
  )
}

const TestTransaction: React.FC = () => {
  const { createTransaction, lastCreatedTransaction } = useCreateTransaction()
  const { transactions } = useTransactions()

  function getTransferSubmittable(api: ApiPromise) {
    return api.tx.balances.transfer('l2uxb9baJaiHhCvMzijnCYbkiXpGQ24jhj4AmhNvrMEzWuoV', 1)
  }

  const { data } = useTransactionFeeEstimate(getTransferSubmittable)

  return (
    <Stack gap={3}>
      <div>
        <div>Balance: {useBalance().data}</div>
        <Button
          onClick={() => createTransaction('Transfer', getTransferSubmittable)}
          loading={lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false}
        >
          Do some transaction
        </Button>
        <div>Est. gas fee: {data}</div>
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
