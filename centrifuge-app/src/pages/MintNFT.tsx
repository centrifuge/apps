import { NFTMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/nfts'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Flex,
  ImageUpload,
  NumberInput,
  Shelf,
  Stack,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { lastValueFrom } from '@polkadot/api-base/node_modules/rxjs'
import React, { useReducer, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { useDebugFlags } from '../components/DebugFlags'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { nftMetadataSchema } from '../schemas'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useAddress } from '../utils/useAddress'
import { useAsyncCallback } from '../utils/useAsyncCallback'
import { useBalance } from '../utils/useBalance'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useIsPageUnchanged } from '../utils/useIsPageUnchanged'
import { isSameAddress } from '../utils/web3'

const DEFAULT_NFT_NAME = 'Untitled NFT'

// TODO: replace with better fee estimate
const MINT_FEE_ESTIMATE = 2
const DEFAULT_MAX_FILE_SIZE_IN_BYTES = 1e6 // 1 MB
const ALLOWED_TYPES = [
  'image/png',
  'image/avif',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/vnd.microsoft.icon',
]
const ACCEPT_STRING = ALLOWED_TYPES.join(',')

export const MintNFTPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <MintNFT />
    </PageWithSideBar>
  )
}

const MintNFT: React.FC = () => {
  const { cid: collectionId } = useParams<{ cid: string }>()
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collectionId)
  const balance = useBalance()
  const address = useAddress()
  const cent = useCentrifuge()
  const [version, setNextVersion] = useReducer((s) => s + 1, 0)
  const history = useHistory()

  const [nftName, setNftName] = useState('')
  const [nftAmount, setNftAmount] = useState(1)
  const [nftDescription, setNftDescription] = useState('')
  const [fileDataUri, setFileDataUri] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const isPageUnchanged = useIsPageUnchanged()

  const isFormValid = nftName.trim() && nftDescription.trim() && fileDataUri

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('Mint NFT', (cent) => cent.nfts.mintNft, {
    onSuccess: ([, nftId]) => {
      reset()

      if (isPageUnchanged()) {
        history.push(`/nfts/collection/${collectionId}/object/${nftId}`)
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

    if (!(nameValue && descriptionValue && file && fileDataUri)) {
      return
    }
    const nftId = await cent.nfts.getAvailableNftId(collectionId)
    const imageMetadataHash = await lastValueFrom(cent.metadata.pinFile(fileDataUri))
    const metadataValues: NFTMetadataInput = {
      name: nameValue,
      description: descriptionValue,
      image: imageMetadataHash.uri,
    }
    doTransaction([collectionId, nftId, address!, metadataValues, nftAmount])
  })

  function reset() {
    setNftName('')
    setNftDescription('')
    setFileDataUri('')
    setFile(null)
    resetLastTransaction()
    resetUpload()
    setNextVersion()
  }

  const isMinting = metadataIsUploading || transactionIsPending

  const balanceLow = !balance || balance < MINT_FEE_ESTIMATE
  const canMint = isSameAddress(address, collection?.owner)
  const fieldDisabled = balanceLow || !canMint || isMinting
  const submitDisabled = !isFormValid || balanceLow || !canMint || isMinting

  const batchMintNFTs = useDebugFlags().batchMintNFTs

  return (
    <form onSubmit={execute} action="">
      <Stack>
        <PageHeader
          title={nftName || DEFAULT_NFT_NAME}
          subtitle={collectionMetadata?.name}
          actions={
            <>
              {uploadError && <Text color="criticalPrimary">Image failed to upload</Text>}
              {(balanceLow || !canMint) && (
                <Text variant="label1" color="criticalForeground">
                  {!canMint
                    ? `You're not the owner of the collection`
                    : `Your balance is too low (${(balance || 0).toFixed(2)} AIR)`}
                </Text>
              )}
              <Button disabled={submitDisabled} type="submit" loading={isMinting}>
                Mint
              </Button>
              <RouterLinkButton to={`/nfts/collection/${collectionId}`} variant="secondary">
                Cancel
              </RouterLinkButton>
            </>
          }
        />
        <PageSection>
          <Shelf alignItems="stretch" flexWrap="wrap" gap={4}>
            <Flex alignItems="stretch" justifyContent="center" flex="1 1 60%" aspectRatio="3 / 2">
              <ImageUpload
                key={version}
                file={file}
                validate={(file) => (file.size > DEFAULT_MAX_FILE_SIZE_IN_BYTES ? 'File size too large' : undefined)}
                onFileChange={async (file) => {
                  if (file) {
                    setFile(file)
                    setFileDataUri(await getFileDataURI(file))
                    if (!nftName) {
                      setNftName(file.name.replace(/\.[a-zA-Z0-9]{2,4}$/, ''))
                    }
                  } else {
                    setFile(null)
                    setFileDataUri('')
                  }
                }}
                accept={ACCEPT_STRING}
              />
            </Flex>
            <Box flex="1 1 30%" minWidth={250}>
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
              {batchMintNFTs && (
                <Box mt={3}>
                  <NumberInput
                    value={nftAmount}
                    label="Amount"
                    type="number"
                    min="1"
                    max="1000"
                    onChange={({ target }) => {
                      setNftAmount(Number((target as HTMLInputElement).value))
                    }}
                    disabled={fieldDisabled}
                  />
                </Box>
              )}
            </Box>
          </Shelf>
        </PageSection>
      </Stack>
    </form>
  )
}
