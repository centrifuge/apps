import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import { TextVariantName } from '@centrifuge/fabric/dist/theme'
import React, { useState } from 'react'
import { useRouteMatch } from 'react-router'
import { FileImageUpload } from '../components/FileImageUpload'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { SplitView } from '../components/SplitView'
import { TextArea } from '../components/TextArea'
import { TextInput } from '../components/TextInput'
import { useWeb3 } from '../components/Web3Provider'
import { fetchLambda } from '../utils/fetchLambda'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useCollectionMetadata } from '../utils/useCollections'
import { truncateAddress } from '../utils/web3'

const DEFAULT_NFT_NAME = 'Untitled NFT'

export const MintNFTPage: React.FC = () => {
  const {
    params: { cid: collectionId },
  } = useRouteMatch<{ cid: string }>()
  const { data: collectionMetadata } = useCollectionMetadata(collectionId)

  const { selectedAccount } = useWeb3()

  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [fileDataUri, setFileDataUri] = useState('')
  const [fileName, setFileName] = useState('')

  const isFormValid = nftName && nftDescription && fileDataUri

  const onSubmit = async () => {
    if (!(nftName && nftDescription && fileDataUri)) {
      return
    }

    const response = await fetchLambda('pinFile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: nftName,
        description: nftDescription,
        fileDataUri,
        fileName,
      }),
    })

    // TODO: do something with the response, handle error
    console.log(response)
  }

  return (
    <SplitView
      left={
        <Flex alignItems="stretch" justifyContent="stretch" height="100%" p={0}>
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
        <Box px={8} py={9}>
          <Stack>
            <Text variant="heading3" style={{ textDecoration: 'underline' }}>
              {collectionMetadata?.name}
            </Text>

            <Stack mt={3} mb={7}>
              <Text variant={'headingLarge' as TextVariantName} as="h1">
                {nftName || DEFAULT_NFT_NAME}
              </Text>
              <Text variant="heading3" color="textSecondary">
                by {truncateAddress(selectedAccount?.address || '')}
              </Text>
            </Stack>
            <form>
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
                <Button disabled={!isFormValid} onClick={onSubmit}>
                  Mint
                </Button>
                <RouterLinkButton to={`/collection/${collectionId}`} variant="outlined">
                  Cancel
                </RouterLinkButton>
              </Shelf>
            </form>
          </Stack>
        </Box>
      }
    />
  )
}
