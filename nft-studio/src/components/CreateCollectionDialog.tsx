import { Button, FileUpload, Shelf, Stack, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { Redirect } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { Dialog } from '../components/Dialog'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { createCollectionMetadata } from '../utils/createCollectionMetadata'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransactionRx } from '../utils/useCentrifugeTransactionRx'
import { fetchMetadata } from '../utils/useMetadata'
import { useCentrifuge } from './CentrifugeProvider'

// TODO: replace with better fee estimate
const CREATE_FEE_ESTIMATE = 2

const MAX_FILE_SIZE_IN_BYTES = 10 * 1024 ** 2 // 1 MB limit by default
const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

export const CreateCollectionDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [logo, setLogo] = useState<File | null>(null)
  const cent = useCentrifuge()
  const balance = useBalance()
  const [redirect, setRedirect] = useState<string>('')

  const isConnected = !!selectedAccount?.address

  const {
    execute: doTransaction,
    lastCreatedTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransactionRx('Create collection', (cent) => cent.nfts.createCollection, {
    onSuccess: ([collectionId]) => {
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
    const descriptionValue = description.trim()
    if (!isConnected || !nameValue || !descriptionValue) return

    const collectionId = await cent.nfts.getAvailableCollectionId()

    let fileName
    let fileDataUri
    if (logo) {
      fileName = logo.name
      fileDataUri = await getFileDataURI(logo)
    }

    const res = await createCollectionMetadata({
      name: nameValue,
      description: descriptionValue,
      fileName,
      fileDataUri,
    })

    queryClient.prefetchQuery(['metadata', res.metadataURI], () => fetchMetadata(res.metadataURI))

    doTransaction([collectionId, selectedAccount!.address, res.metadataURI])
  })

  // Only close if the modal is still showing the last created collection
  useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
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
          <TextAreaInput
            label="Description"
            value={description}
            maxLength={collectionMetadataSchema.description.maxLength}
            onChange={(e) => setDescription(e.target.value)}
            disabled={fieldDisabled}
          />
          <FileUpload
            label="Collection logo (JPEG, SVG, PNG, or GIF up to 1 MB)"
            placeholder="Add file"
            onFileUpdate={(file) => setLogo(file)}
            onFileCleared={() => setLogo(null)}
            validate={(file) => {
              if (!isImageFile(file)) {
                return 'File format not supported'
              }
              if (file.size > MAX_FILE_SIZE_IN_BYTES) {
                return 'File too large'
              }
            }}
            // accept="image/*"
          />
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balance || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              {uploadError && <Text color="criticalPrimary">Failed to create collection</Text>}
              <Button variant="outlined" onClick={close}>
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
