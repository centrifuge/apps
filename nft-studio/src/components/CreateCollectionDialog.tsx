import { Button, Stack, Text } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import * as React from 'react'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { useCreateTransaction } from '../utils/useCreateTransaction'

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { selectedAccount } = useWeb3()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const { createTransaction, lastCreatedTransaction } = useCreateTransaction()

  function getCreateSubmittable(api: ApiPromise) {
    return api.tx.utility.batchAll([
      api.tx.uniques.create(7, selectedAccount!.address),
      api.tx.uniques.setClassMetadata(
        7,
        `data:application/json;base64,${btoa(JSON.stringify({ name, description }))}`,
        true
      ),
    ])
  }

  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Create new collection
        </Text>
        <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
        <textarea value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
        <ButtonGroup>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name}
            onClick={() => createTransaction('Transfer', getCreateSubmittable)}
            loading={
              lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false
            }
          >
            Create
          </Button>
        </ButtonGroup>
      </Stack>
    </Dialog>
  )
}
