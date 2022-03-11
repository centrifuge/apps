import { Box, Button, IconAlertCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import styled from 'styled-components'
import { getFileDataURI } from '../utils/getFileDataURI'
import { SUPPORTED_IMAGE_TYPES_STRING, validateImageFile } from '../utils/validateImageFile'
import { FileInputOverlay } from './FileInputOverlay'

const FileUploadContainer = styled.div<{ hasPreview: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 1/1;
  position: relative;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px dashed ${({ theme }) => theme.colors.textDisabled};
  background-color: ${({ theme }) => theme.colors.backgroundForm};
  :hover {
    ${({ hasPreview }) => (hasPreview ? 'filter: contrast(0.5);' : '')}
  }
`

const ImgPreview = styled.img`
  min-width: 200px;
  min-height: 200px;
  max-width: 600px;
  max-height: 600px;
  object-fit: contain;
`

type Props = {
  onFileUpdate: (file: File | null) => void
}

export const FileImageUpload: React.FC<Props> = ({ onFileUpdate }) => {
  const [, setCurFile] = useState<File | null>(null)
  const [fileDataUri, setFileDataUri] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const showErrorMsg = (err: string) => {
    setErrorMsg(err)
    onFileUpdate(null)
    setCurFile(null)
    setFileName('')
    setFileDataUri('')
    return false
  }

  const handleNewFileUpload = (newFiles: FileList) => {
    const newFile = newFiles[0]

    const errMsg = validateImageFile(newFile)
    if (errMsg) {
      return showErrorMsg(errMsg)
    }

    setCurFile(newFile)
    setFileName(newFile.name)
    onFileUpdate(newFile)
    getFileDataURI(newFile).then((dataUri) => {
      setFileDataUri(dataUri)
    })
    return true
  }

  const onSingleFileUpdate = (files: FileList) => onFileUpdate(files[0])

  return (
    <FileUploadContainer hasPreview={!!fileDataUri}>
      {!fileDataUri && (
        <Stack alignItems="center" height="100%">
          <Shelf flex="1" alignItems="flex-end">
            {errorMsg && (
              <Shelf gap={1} mb={6} alignItems="center">
                <IconAlertCircle color="statusCritical" />
                <Text color="statusCritical">{errorMsg}</Text>
              </Shelf>
            )}
          </Shelf>
          <Box>
            <Text variant="body1" textAlign="center">
              Drop file to upload <br /> or
            </Text>
          </Box>
          <Box mb={4} mt={1}>
            <Button variant="outlined">Choose file</Button>
          </Box>

          <Text variant="body2" color="textSecondary">
            Upload JPEG, SVG, PNG, or GIF up to 1 MB
          </Text>
          <Box flex="1"></Box>
        </Stack>
      )}
      {fileDataUri && (
        <Stack p={2} height="100%">
          <Box flex="1" pb={2}>
            {' '}
          </Box>
          <ImgPreview src={fileDataUri} alt="Preview" />
          <Shelf flex="1" textAlign="center" justifyContent="center" alignItems="flex-end" pt={2}>
            <Text variant="body2">{fileName}</Text>
          </Shelf>
        </Stack>
      )}
      <FileInputOverlay
        onFilesUpdate={onSingleFileUpdate}
        onBeforeFilesUpdate={handleNewFileUpload}
        accept={SUPPORTED_IMAGE_TYPES_STRING}
      />
    </FileUploadContainer>
  )
}
