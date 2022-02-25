import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import React, { useReducer, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { FileImageUpload } from '../components/FileImageUpload'
import { Identity } from '../components/Identity'
import { PageHeader } from '../components/PageHeader'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { SplitView } from '../components/SplitView'
import { TextArea } from '../components/TextArea'
import { TextInput } from '../components/TextInput'
import { useWeb3 } from '../components/Web3Provider'
import { nftMetadataSchema } from '../schemas'
import { createNFTMetadata } from '../utils/createNFTMetadata'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransactionRx } from '../utils/useCentrifugeTransactionRx'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
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
  const { selectedAccount } = useWeb3()
  const cent = useCentrifuge()
  const [version, setNextVersion] = useReducer((s) => s + 1, 0)

  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [fileDataUri, setFileDataUri] = useState('')
  const [fileName, setFileName] = useState('')

  const isFormValid = nftName && nftDescription && fileDataUri

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransactionRx('Mint NFT', (cent) => cent.nfts.mintNft, {
    onSuccess: () => {
      queryClient.invalidateQueries(['nfts', collectionId])
      queryClient.invalidateQueries(['collectionPreview', collectionId])
      queryClient.invalidateQueries('balance')
      queryClient.invalidateQueries(['accountNfts', selectedAccount?.address])
      reset()
    },
  })

  const {
    execute,
    isError: uploadError,
    isLoading: metadataIsUploading,
    reset: resetUpload,
  } = useAsyncCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(nftName && nftDescription && fileDataUri)) {
      return
    }
    const nftId = await cent.nfts.getAvailableNftId(collectionId)
    const res = await createNFTMetadata({
      name: nftName,
      description: nftDescription,
      fileDataUri,
      fileName,
    })

    queryClient.prefetchQuery(['metadata', res.metadataURI], () => fetchMetadata(res.metadataURI))

    doTransaction([collectionId, nftId, selectedAccount!.address, res.metadataURI])
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
  const canMint = isSameAddress(selectedAccount?.address, collection?.owner)
  const disabled = !isFormValid || balanceLow || !canMint

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        parent={{ label: collectionMetadata?.name ?? 'Collection', to: `/collection/${collectionId}` }}
        title={nftName || DEFAULT_NFT_NAME}
        subtitle={
          selectedAccount?.address && (
            <>
              by <Identity address={selectedAccount.address} clickToCopy />
            </>
          )
        }
        actions={<></>}
      />
      <SplitView
        left={
          <Flex alignItems="stretch" justifyContent="stretch" height="100%" p={[2, 4, 0]}>
            <FileImageUpload
              key={version}
              onFileUpdate={async (file) => {
                if (file) {
                  setFileName(file.name)
                  setFileDataUri(await getFileDataURI(file))
                  if (!nftName) {
                    setNftName(file.name)
                  }
                }
              }}
            />
          </Flex>
        }
        right={
          <Box px={[2, 4, 8]} py={9}>
            <Stack>
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
                  />
                </Box>
                <TextArea
                  label="Description"
                  value={nftDescription}
                  maxLength={nftMetadataSchema.description.maxLength}
                  onChange={({ target }) => {
                    setNftDescription((target as HTMLTextAreaElement).value)
                  }}
                />

                <Shelf gap={2} mt={6}>
                  <Button disabled={disabled} type="submit" loading={isMinting}>
                    Mint
                  </Button>
                  <RouterLinkButton to={`/collection/${collectionId}`} variant="outlined">
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
