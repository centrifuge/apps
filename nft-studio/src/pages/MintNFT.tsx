import { Box, Button, Stack, Text } from '@centrifuge/fabric'
import { Flex } from '@centrifuge/fabric/dist/components/Flex'
import React, { useState } from 'react'
import { SplitView } from '../components/SplitView'
import { fetchLambda } from '../utils/fetchLambda'
import { getFileDataURI } from '../utils/getFileDataURI'

export const MintNFTPage: React.FC = () => {
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
        <Flex alignItems="center" justifyContent="center" height="100%">
          {fileDataUri && <img src={fileDataUri} alt="Preview" />}
          {!fileDataUri && (
            <input
              type="file"
              name="file"
              onChange={async (ev) => {
                const file = ev.target?.files && ev.target.files[0]
                if (file) {
                  setFileName(file.name)
                  setFileDataUri(await getFileDataURI(file))
                }
              }}
            />
          )}
        </Flex>
      }
      right={
        <Box px={5} py={9} bg="backgroundPage">
          <Stack>
            <Text variant="heading2">COLLECTION NAME</Text>

            <Text variant="heading1">{nftName || 'Untitled NFT'}</Text>
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
