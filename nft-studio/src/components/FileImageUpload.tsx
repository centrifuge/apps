import { Box, Stack, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import styled from 'styled-components'
import { getFileDataURI } from '../utils/getFileDataURI'
import { FileInput } from './FileInput'

const FileUploadContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
`

type Props = {
  onFileUpdate: (file: File) => void
  maxFileSizeInBytes?: number
}

const DEFAULT_MAX_FILE_SIZE_IN_BYTES = Infinity // no limit by default
const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

export const FileImageUpload: React.FC<Props> = ({
  onFileUpdate,
  maxFileSizeInBytes = DEFAULT_MAX_FILE_SIZE_IN_BYTES,
}) => {
  const [, setCurFile] = useState<File | null>(null)
  const [fileDataUri, setFileDataUri] = useState<string>('')

  const handleNewFileUpload = (newFile: File) => {
    if (!isImageFile(newFile)) {
      console.error(`Only image files are allowed (selected file of type ${newFile.type})`)
      return false
    }
    if (newFile.size > maxFileSizeInBytes) {
      console.error(
        `Files bigger than ${maxFileSizeInBytes} bytes are not allowed (selected file of ${newFile.size} bites)`
      )
      return false
    }
    setCurFile(newFile)
    onFileUpdate(newFile)
    getFileDataURI(newFile).then((dataUri) => {
      setFileDataUri(dataUri)
    })
    return true
  }

  return (
    <FileUploadContainer>
      {!fileDataUri && (
        <Stack>
          <FileInput onFileUpdate={onFileUpdate} onBeforeFileUpdate={handleNewFileUpload} />
          <Box pt={2} pl={1}>
            <Text variant="label1">Or drag image here</Text>
          </Box>
        </Stack>
      )}
      {fileDataUri && <img src={fileDataUri} alt="Preview" />}
    </FileUploadContainer>
  )
}
