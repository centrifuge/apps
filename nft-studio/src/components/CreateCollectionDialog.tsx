import { Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { createCollectionMetadata } from '../utils/createCollectionMetadata'
import { getAvailableClassId } from '../utils/getAvailableClassId'
import { useBalance } from '../utils/useBalance'
import { useCreateTransaction } from '../utils/useCreateTransaction'
import { TextArea } from './TextArea'
import { TextInput } from './TextInput'

// TODO: replace with better fee estimate
const CREATE_FEE_ESTIMATE = 2

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const { createTransaction, lastCreatedTransaction, reset: resetLastTransaction } = useCreateTransaction()
  const { data: balance } = useBalance()

  const isConnected = !!selectedAccount?.address

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !name || !description) return

    createTransaction(
      'Create collection',
      async (api) => {
        const classId = await getAvailableClassId()
        const res = await createCollectionMetadata(name, description)

        return api.tx.utility.batchAll([
          api.tx.uniques.create(classId, selectedAccount!.address),
          api.tx.uniques.setClassMetadata(classId, res.metadataURI, true),
        ])
      },
      () => {
        queryClient.invalidateQueries('collections')
        queryClient.invalidateQueries('balance')
      }
    )
  }

  // Only close if the modal is still showing the last created collection
  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'succeeded') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function reset() {
    setName('')
    setDescription('')
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  const balanceLow = !balance || balance < CREATE_FEE_ESTIMATE

  const disabled = !isConnected || !name || balanceLow

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Create new collection
          </Text>
          <TextInput
            label="Name"
            value={name}
            maxLength={collectionMetadataSchema.name.maxLength}
            onChange={(e) => setName(e.target.value)}
          />
          <TextArea
            label="Description"
            value={description}
            maxLength={collectionMetadataSchema.description.maxLength}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balance || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              <Button variant="outlined" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={disabled}
                loading={
                  lastCreatedTransaction
                    ? ['creating', 'unconfirmed', 'pending'].includes(lastCreatedTransaction?.status)
                    : false
                }
              >
                Create
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
