import { Box, Button, Shelf, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import styled from 'styled-components'
import { FileInputOverlay } from './FileInputOverlay'

const FileUploadContainer = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
`

const FileInputWrapper = styled.div`
  position: relative;
`

type Props = {
  onFileUpdate: (file: File) => void
  onBeforeFileUpdate?: (file: File) => boolean
}

export const FileInput: React.FC<Props> = ({ onFileUpdate, onBeforeFileUpdate }) => {
  const [curFile, setCurFile] = useState<File | null>(null)

  const handleNewFileUpload = async (newFiles: FileList) => {
    if (newFiles?.length) {
      const newFile = newFiles[0]

      if (onBeforeFileUpdate && !onBeforeFileUpdate(newFile)) {
        return
      }

      setCurFile(newFile)
      onFileUpdate(newFile)
    }
  }

  return (
    <FileUploadContainer>
      <Shelf>
        <FileInputWrapper>
          <Button variant="outlined">Choose file</Button>
          <FileInputOverlay onFilesUpdate={handleNewFileUpload} />
        </FileInputWrapper>
        <Box pl={2}>
          <Text variant="label1">{curFile ? curFile.name : 'No file selected'}</Text>
        </Box>
      </Shelf>
    </FileUploadContainer>
  )
}
