import { Button, Grid, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import { BN } from '@polkadot/util'
import * as React from 'react'
import { ButtonGroup } from '../components/ButtonGroup'
import { CollectionCard } from '../components/CollectionCard'
import { Dialog } from '../components/Dialog'
import { Footer } from '../components/Footer'
import { PageContainer } from '../components/PageContainer'
import { useTransactions } from '../components/TransactionsProvider'
import { useWeb3 } from '../components/Web3Provider'
import { useBalance } from '../utils/useBalance'
import { useCreateTransaction } from '../utils/useCreateTransaction'
import { useTransactionFeeEstimate } from '../utils/useTransactionFeeEstimate'

export const CollectionsPage: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false)
  const { selectedAccount } = useWeb3()

  return (
    <PageContainer>
      <Stack gap={8} flex={1}>
        {selectedAccount && (
          <Stack gap={3}>
            <Shelf justifyContent="space-between">
              <Text variant="heading2" as="h2">
                My Collections
              </Text>
              <Button onClick={() => setCreateOpen(true)} variant="text" icon={IconPlus}>
                Create Collection
              </Button>
            </Shelf>
            <Shelf justifyContent="center" textAlign="center">
              <Text variant="heading2" color="textSecondary">
                You have no collections yet
              </Text>
            </Shelf>
          </Stack>
        )}
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            {selectedAccount ? 'Other Collections' : 'Collections'}
          </Text>
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
        <CreateCollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        <Footer />
      </Stack>
    </PageContainer>
  )
}

const TestTransaction: React.FC = () => {
  const { createTransaction, lastCreatedTransaction } = useCreateTransaction()
  const { transactions } = useTransactions()

  function getTransferSubmittable(api: ApiPromise) {
    return api.tx.balances.transfer('kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF', new BN(1).pow(new BN(18)))
  }

  const { data } = useTransactionFeeEstimate(getTransferSubmittable)

  return (
    <Stack gap={3}>
      <Text>
        <div>Balance: {useBalance().data}</div>
        <Button
          onClick={() => createTransaction('Transfer', getTransferSubmittable)}
          loading={lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false}
        >
          Do some transaction
        </Button>
        <div>Est. gas fee: {data}</div>
        <div>Transactions</div>
        {transactions.map((tx) => (
          <dl key={tx.id}>
            <dt>Id:</dt>
            <dd>{tx.id}</dd>
            <dt>Status:</dt>
            <dd>{tx.status}</dd>
            <dt>Description:</dt>
            <dd>{tx.description}</dd>
          </dl>
        ))}
      </Text>
    </Stack>
  )
}

const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Create new collection
        </Text>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <ButtonGroup>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name}>Create</Button>
        </ButtonGroup>
      </Stack>
    </Dialog>
  )
}
