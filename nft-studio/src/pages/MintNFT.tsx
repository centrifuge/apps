import { Box, Button, IconArrowLeft, Shelf, Stack, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import React, { useReducer, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useHistory, useParams } from 'react-router'
import { NavLink } from 'react-router-dom'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { FileImageUpload } from '../components/FileImageUpload'
import { PageHeader } from '../components/PageHeader'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { SplitView } from '../components/SplitView'
import { nftMetadataSchema } from '../schemas'
import { createNFTMetadata } from '../utils/createNFTMetadata'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useAddress } from '../utils/useAddress'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useIsPageUnchanged } from '../utils/useIsPageUnchanged'
import { fetchMetadata } from '../utils/useMetadata'
import { isSameAddress } from '../utils/web3'

const DEFAULT_NFT_NAME = 'Untitled NFT'

// TODO: replace with better fee estimate
const MINT_FEE_ESTIMATE = 2

export const MintNFTPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <MintNFT />
    </PageWithSideBar>
  )
}

const MintNFT: React.FC = () => {
  const { cid: collectionId } = useParams<{ cid: string }>()
  const queryClient = useQueryClient()
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collectionId)
  const { data: balance } = useBalance()
  const address = useAddress()
  const cent = useCentrifuge()
  const [version, setNextVersion] = useReducer((s) => s + 1, 0)
  const history = useHistory()

  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [fileDataUri, setFileDataUri] = useState('')
  const [fileName, setFileName] = useState('')

  const isPageUnchanged = useIsPageUnchanged()

  const isFormValid = nftName.trim() && nftDescription.trim() && fileDataUri

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('Mint NFT', (cent) => cent.nfts.mintNft, {
    onSuccess: ([, nftId]) => {
      queryClient.invalidateQueries(['nfts', collectionId])
      queryClient.invalidateQueries(['collectionPreview', collectionId])
      queryClient.invalidateQueries('balance')
      queryClient.invalidateQueries(['accountNfts', address])
      reset()

      if (isPageUnchanged()) {
        history.push(`/collection/${collectionId}/object/${nftId}`)
      }
    },
  })

  const {
    execute,
    isError: uploadError,
    isLoading: metadataIsUploading,
    reset: resetUpload,
  } = useAsyncCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const nameValue = nftName.trim()
    const descriptionValue = nftDescription.trim()

    if (!(nameValue && descriptionValue && fileDataUri)) {
      return
    }
    const nftId = await cent.nfts.getAvailableNftId(collectionId)
    const res = await createNFTMetadata({
      name: nameValue,
      description: descriptionValue,
      fileDataUri,
      fileName,
    })

    queryClient.prefetchQuery(['metadata', res.metadataURI], () => fetchMetadata(res.metadataURI))

    doTransaction([collectionId, nftId, address!, res.metadataURI])
  })

  function reset() {
    setNftName('')
    setNftDescription('')
    setFileDataUri('')
    setFileName('')
    resetLastTransaction()
    resetUpload()
    setNextVersion()
  }

  const isMinting = metadataIsUploading || transactionIsPending

  const balanceLow = !balance || balance < MINT_FEE_ESTIMATE
  const canMint = isSameAddress(address, collection?.owner)
  const fieldDisabled = balanceLow || !canMint || isMinting
  const submitDisabled = !isFormValid || balanceLow || !canMint || isMinting

  return (
    <Stack flex={1}>
      <PageHeader
        parent={{ label: collectionMetadata?.name ?? 'Collection', to: `/collection/${collectionId}` }}
        title={nftName || DEFAULT_NFT_NAME}
      />

      <SplitView
        left={
          <Box>
            <Box pt={1}>
              <RouterLinkButton icon={IconArrowLeft} to={`/collection/${collectionId}`} variant="text">
                Back
              </RouterLinkButton>
            </Box>
            <Flex alignItems="stretch" justifyContent="center" height="100%" p={[2, 4, 0]} mx={8} mt={2}>
              <FileImageUpload
                key={version}
                onFileUpdate={async (file) => {
                  if (file) {
                    setFileName(file.name)
                    setFileDataUri(await getFileDataURI(file))
                    if (!nftName) {
                      setNftName(file.name.replace(/\.[a-zA-Z0-9]{2,4}$/, ''))
                    }
                  } else {
                    setFileName('')
                    setFileDataUri('')
                  }
                }}
              />
            </Flex>
          </Box>
        }
        right={
          <Box px={[2, 4, 8]} py={9}>
            <Stack gap={6}>
              <Stack gap={1}>
                <NavLink to={`/collection/${collectionId}`}>
                  <Text variant="heading3" underline style={{ wordBreak: 'break-word' }}>
                    {collectionMetadata?.name}
                  </Text>
                </NavLink>
                <Text variant="heading1" fontSize="36px" fontWeight="700" mb="4px" style={{ wordBreak: 'break-word' }}>
                  {nftName || 'Untitled NFT'}
                </Text>
              </Stack>
              <form onSubmit={execute} action="">
                <Box mb={3}>
                  <TextInput
                    label="Name"
                    placeholder={DEFAULT_NFT_NAME}
                    value={nftName}
                    maxLength={nftMetadataSchema.name.maxLength}
                    onChange={({ target }) => {
                      setNftName((target as HTMLInputElement).value)
                    }}
                    disabled={fieldDisabled}
                  />
                </Box>
                <TextAreaInput
                  label="Description"
                  value={nftDescription}
                  maxLength={nftMetadataSchema.description.maxLength}
                  onChange={({ target }) => {
                    setNftDescription((target as HTMLTextAreaElement).value)
                  }}
                  disabled={fieldDisabled}
                />

                <Shelf gap={2} mt={6}>
                  <Button disabled={submitDisabled} type="submit" loading={isMinting}>
                    Mint
                  </Button>
                  <RouterLinkButton to={`/collection/${collectionId}`} variant="outlined" disabled={submitDisabled}>
                    Cancel
                  </RouterLinkButton>
                  {(balanceLow || !canMint) && (
                    <Text variant="label1" color="criticalForeground">
                      {!canMint
                        ? `You're not the owner of the collection`
                        : `Your balance is too low (${(balance || 0).toFixed(2)} AIR)`}
                    </Text>
                  )}
                  {uploadError && <Text color="criticalPrimary">Image failed to upload</Text>}
                </Shelf>
              </form>
            </Stack>
          </Box>
        }
      />
    </Stack>
  )
}
