import { Button, FileUpload, Shelf, Stack, Text } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { Redirect } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { createCollectionMetadata } from '../utils/createCollectionMetadata'
import { getFileIpfsHash } from '../utils/getFileIpfsHash'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { fetchMetadata } from '../utils/useMetadata'
import { SUPPORTED_IMAGE_TYPES_STRING, validateImageFile } from '../utils/validateImageFile'
import { useCentrifuge } from './CentrifugeProvider'
import { TextArea } from './TextArea'
import { TextInput } from './TextInput'

// TODO: replace with better fee estimate
const CREATE_FEE_ESTIMATE = 2

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const cent = useCentrifuge()
  const { data: balance } = useBalance()
  const [redirect, setRedirect] = useState<string>('')
  const [logoFile, setLogoFile] = useState<File>()

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
      setRedirect(`/collection/${collectionId}`)
    },
  })

  const {
    execute,
    isLoading: metadataIsUploading,
    isError: uploadError,
    reset: resetUpload,
  } = useAsyncCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const nameValue = name.trim()
    const descriptionValue = name.trim()
    if (!isConnected || !nameValue || !descriptionValue) return

    const logoHash = logoFile ? (await getFileIpfsHash(logoFile)) || '' : ''

    const collectionId = await cent.nfts.getAvailableCollectionId()
    const res = await createCollectionMetadata(nameValue, descriptionValue, logoHash)

    queryClient.prefetchQuery(['metadata', res.metadataURI], () => fetchMetadata(res.metadataURI))

    doTransaction([collectionId, selectedAccount!.address, res.metadataURI])
  })

  // Only close if the modal is still showing the last created collection
  useEffect(() => {
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
  const disabled = !isConnected || !name.trim() || !description.trim() || balanceLow || isTxPending

  if (redirect) {
    return <Redirect to={redirect} />
  }

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
          <Stack gap={1}>
            <Text variant="label1">Upload collection logo (JPEG, SVG, PNG, or GIF up to 1 MB)</Text>
            <FileUpload
              onFileUpdate={(file) => setLogoFile(file)}
              onFileCleared={() => setLogoFile(undefined)}
              placeholder="Add file"
              validate={validateImageFile}
              accept={SUPPORTED_IMAGE_TYPES_STRING}
            />
          </Stack>

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
