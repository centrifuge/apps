import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import { TextVariantName } from '@centrifuge/fabric/dist/theme'
import React, { useState } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router'
import { FileImageUpload } from '../components/FileImageUpload'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { SplitView } from '../components/SplitView'
import { TextArea } from '../components/TextArea'
import { TextInput } from '../components/TextInput'
import { useWeb3 } from '../components/Web3Provider'
import { createNFTMetadata } from '../utils/createNFTMetadata'
import { getAvailableAssetId } from '../utils/getAvailableClassId'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useBalance } from '../utils/useBalance'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useCreateTransaction } from '../utils/useCreateTransaction'
import { isSameAddress, truncateAddress } from '../utils/web3'

const DEFAULT_NFT_NAME = 'Untitled NFT'

export const MintNFTPage: React.FC = () => {
  const { cid: collectionId } = useParams<{ cid: string }>()
  const queryClient = useQueryClient()
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collectionId)
  const { createTransaction, lastCreatedTransaction, reset: resetLastTransaction } = useCreateTransaction()
  const { data: balance } = useBalance()
  const { selectedAccount } = useWeb3()

  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [fileDataUri, setFileDataUri] = useState('')
  const [fileName, setFileName] = useState('')

  const isFormValid = nftName && nftDescription && fileDataUri

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!(nftName && nftDescription && fileDataUri)) {
      return
    }

    createTransaction('Mint NFT', async (api) => {
      const assetId = await getAvailableAssetId(collectionId)
      const res = await createNFTMetadata({
        name: nftName,
        description: nftDescription,
        fileDataUri,
        fileName,
      })

      return api.tx.utility.batchAll([
        api.tx.uniques.mint(collectionId, assetId, selectedAccount!.address),
        api.tx.uniques.setMetadata(collectionId, assetId, res.metadataURI, true),
      ])
    })
  }

  function reset() {
    setNftName('')
    setNftDescription('')
    setFileDataUri('')
    setFileName('')
    resetLastTransaction()
  }

  const isMinting = lastCreatedTransaction
    ? ['creating', 'unconfirmed', 'pending'].includes(lastCreatedTransaction?.status)
    : false

  const balanceLow = !balance || balance < 2
  const canMint = isSameAddress(selectedAccount?.address, collection?.owner)
  const disabled = !isFormValid || balanceLow || !canMint

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'succeeded') {
      queryClient.invalidateQueries(['nfts', collectionId])
      queryClient.invalidateQueries('balance')
      reset()
    }
    // eslint-disable-next-line
  }, [queryClient, lastCreatedTransaction?.status])

  return (
    <SplitView
      left={
        <Flex alignItems="stretch" justifyContent="stretch" height="100%" p={[2, 4, 0]}>
          <FileImageUpload
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
            <Text variant="heading3" style={{ textDecoration: 'underline' }}>
              {collectionMetadata?.name}
            </Text>

            <Stack mt={3} mb={7}>
              <Text variant={'headingLarge' as TextVariantName} as="h1">
                {nftName || DEFAULT_NFT_NAME}
              </Text>
              {selectedAccount?.address && (
                <Text variant="heading3" color="textSecondary">
                  by {truncateAddress(selectedAccount.address)}
                </Text>
              )}
            </Stack>
            <form onSubmit={submit} action="">
              <Box mb={3}>
                <TextInput
                  label="Name"
                  placeholder={DEFAULT_NFT_NAME}
                  value={nftName}
                  onChange={({ target }) => {
                    setNftName((target as HTMLInputElement).value)
                  }}
                />
              </Box>
              <TextArea
                label="Description"
                value={nftDescription}
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
              </Shelf>
            </form>
          </Stack>
        </Box>
      }
    />
  )
}
