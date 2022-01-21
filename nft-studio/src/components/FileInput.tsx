import { Box, Button, Shelf, Text } from '@centrifuge/fabric'
import React, { useRef, useState } from 'react'
import styled from 'styled-components'

const FileUploadContainer = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
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
  onBeforeFileUpdate?: (file: File) => boolean
}

export const FileInput: React.FC<Props> = ({ onFileUpdate, onBeforeFileUpdate }) => {
  const fileInputField = useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useState<File | null>(null)

  const handleUploadBtnClick = () => {
    fileInputField?.current?.click()
  }

  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: newFiles } = e.target
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
        <Button variant="outlined" onClick={handleUploadBtnClick}>
          Choose file
        </Button>
        <Box pl={2}>
          <Text variant="label1">{curFile ? curFile.name : 'No file selected'}</Text>
        </Box>
      </Shelf>
      <FormField type="file" ref={fileInputField} onChange={handleNewFileUpload} title="" value="" tabIndex={-1} />
    </FileUploadContainer>
  )
}
