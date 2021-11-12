import { Box, Button, Stack, Text } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import React, { useState } from 'react'
import { useRouteMatch } from 'react-router'
import { FileImageUpload } from '../components/FileImageUpload'
import { SplitView } from '../components/SplitView'
import { useWeb3 } from '../components/Web3Provider'
import { fetchLambda } from '../utils/fetchLambda'
import { formatAddress } from '../utils/format/formatAddress'
import { getFileDataURI } from '../utils/getFileDataURI'
import { useCollectionMetadata } from '../utils/useCollections'

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
        <Box px={5} py={9} bg="backgroundPage">
          <Stack>
            <Text variant="heading2">{collectionMetadata?.name}</Text>

            <Text variant="heading1">{nftName || 'Untitled NFT'}</Text>
            <Text variant="heading3">by {formatAddress(selectedAccount?.address || '')}</Text>
            <form>
              <div>
                Name
                <input
                  type="text"
                  name="name"
                  value={nftName}
                  onChange={({ target }) => {
                    setNftName(target.value)
                  }}
                />
              </div>
              <div>
                Description
                <input
                  type="text"
                  name="description"
                  value={nftDescription}
                  onChange={({ target }) => {
                    setNftDescription(target.value)
                  }}
                />
              </div>

              <Button disabled={!isFormValid} onClick={onSubmit}>
                Mint
              </Button>
              <Button>Cancel</Button>
            </form>
          </Stack>
        </Box>
      }
    />
  )
}
