import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { getFileDataURI } from '../utils/getFileDataURI'

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

const FormField = styled.input`
  font-size: 18px;
  display: block;
  width: 100%;
  border: none;
  text-transform: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;

  &:focus {
    outline: none;
  }
`

type Props = {
  onFileUpdate: (file: File) => void
  maxFileSizeInBytes?: number
}

const DEFAULT_MAX_FILE_SIZE_IN_BYTES = Infinity // no limit by default

const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

export const FileImageUploadOld: React.FC<Props> = ({
  onFileUpdate,
  maxFileSizeInBytes = DEFAULT_MAX_FILE_SIZE_IN_BYTES,
}) => {
  const fileInputField = useRef<HTMLInputElement>(null)
  const [, setCurFile] = useState<File | null>(null)
  const [fileDataUri, setFileDataUri] = useState<string>('')

  const handleUploadBtnClick = () => {
    fileInputField?.current?.click()
  }

  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: newFiles } = e.target
    if (newFiles?.length) {
      const newFile = newFiles[0]
      if (!isImageFile(newFile)) {
        console.error(`Only image files are allowed (selected file of type ${newFile.type})`)
        return
      }
      if (newFile.size > maxFileSizeInBytes) {
        console.error(
          `Files bigger than ${maxFileSizeInBytes} bytes are not allowed (selected file of ${newFile.size} bites)`
        )
        return
      }
      setCurFile(newFile)
      onFileUpdate(newFile)
      setFileDataUri(await getFileDataURI(newFile))
    }
  }

  return (
    <FileUploadContainer>
      {!fileDataUri && (
        <Stack>
          <Shelf>
            <Button variant="outlined" onClick={handleUploadBtnClick}>
              Choose file
            </Button>
            <Box pl={2}>
              <Text variant="label1">No file selected</Text>
            </Box>
          </Shelf>
          <Box pt={2} pl={1}>
            <Text variant="label1">Or drag image here</Text>
          </Box>
        </Stack>
      )}
      <FormField type="file" ref={fileInputField} onChange={handleNewFileUpload} title="" value="" />
      {fileDataUri && <img src={fileDataUri} alt="Preview" />}
    </FileUploadContainer>
  )
}
