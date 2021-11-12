import { Button, Stack, Text } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { createCollectionMetadata } from '../utils/createCollectionMetadata'
import { getAvailableClassId } from '../utils/getAvailableClassId'
import { useCreateTransaction } from '../utils/useCreateTransaction'

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const { createTransaction, lastCreatedTransaction } = useCreateTransaction()

  const isConnected = !!selectedAccount?.address

  const onClickCreate = async () => {
    if (!isConnected || !name || !description) return

    const classId = await getAvailableClassId()
    const res = await createCollectionMetadata(name, description)

    createTransaction('Create collection', (api: ApiPromise) =>
      api.tx.utility.batchAll([
        api.tx.uniques.create(classId, selectedAccount!.address),
        api.tx.uniques.setClassMetadata(classId, res.metadataURI, true),
      ])
    )
  }

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'succeeded') {
      queryClient.invalidateQueries('collections')
      queryClient.invalidateQueries('balance')
    }
  }, [queryClient, lastCreatedTransaction?.status])

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
            disabled={!isConnected || !name}
            onClick={onClickCreate}
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
