import { Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useHistory } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { createCollectionMetadata } from '../utils/createCollectionMetadata'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useIsPageUnchanged } from '../utils/useIsPageUnchanged'
import { fetchMetadata } from '../utils/useMetadata'
import { useCentrifuge } from './CentrifugeProvider'
import { TextArea } from './TextArea'
import { TextInput } from './TextInput'

// TODO: replace with better fee estimate
const CREATE_FEE_ESTIMATE = 2

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const cent = useCentrifuge()
  const { data: balance } = useBalance()
  const isPageUnchanged = useIsPageUnchanged()
  const history = useHistory()

  const isConnected = !!selectedAccount?.address

  const {
    execute: doTransaction,
    lastCreatedTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('Create collection', (cent) => cent.nfts.createCollection, {
    onSuccess: ([collectionId]) => {
      queryClient.invalidateQueries('collections')
      queryClient.invalidateQueries('balance')
      if (open && isPageUnchanged()) {
        history.push(`/collection/${collectionId}`)
      }
    },
  })

  const {
    execute,
    isLoading: metadataIsUploading,
    isError: uploadError,
    reset: resetUpload,
  } = useAsyncCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !name || !description) return

    const collectionId = await cent.nfts.getAvailableCollectionId()
    const res = await createCollectionMetadata(name, description)

    queryClient.prefetchQuery(['metadata', res.metadataURI], () => fetchMetadata(res.metadataURI))

    doTransaction([collectionId, selectedAccount!.address, res.metadataURI])
  })

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
    resetUpload()
  }

  function close() {
    reset()
    onClose()
  }

  const balanceLow = !balance || balance < CREATE_FEE_ESTIMATE
  const isTxPending = metadataIsUploading || transactionIsPending

  const fieldDisabled = !isConnected || balanceLow || isTxPending
  const disabled = !isConnected || !name || balanceLow || isTxPending

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={execute}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Create new collection
          </Text>
          <TextInput
            label="Name"
            value={name}
            maxLength={collectionMetadataSchema.name.maxLength}
            onChange={(e) => setName(e.target.value)}
            disabled={fieldDisabled}
          />
          <TextArea
            label="Description"
            value={description}
            maxLength={collectionMetadataSchema.description.maxLength}
            onChange={(e) => setDescription(e.target.value)}
            disabled={fieldDisabled}
          />
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balance || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              {uploadError && <Text color="criticalPrimary">Failed to create collection</Text>}
              <Button variant="outlined" onClick={close} disabled={fieldDisabled}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled} loading={isTxPending}>
                Create
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
