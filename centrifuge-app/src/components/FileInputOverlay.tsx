import React from 'react'
import styled from 'styled-components'

const Input = styled.input`
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
  cursor: pointer;

  &::-webkit-file-upload-button {
    cursor: pointer;
  }

  &:focus {
    outline: none;
  }
`

type Props = {
  onFilesUpdate: (files: FileList) => void
  onBeforeFilesUpdate?: (files: FileList) => boolean
  multiple?: boolean
  accept?: string
}

export const FileInputOverlay: React.FC<Props> = ({ onFilesUpdate, onBeforeFilesUpdate, multiple, accept }) => {
  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: newFiles } = e.target
    if (newFiles?.length) {
      if (onBeforeFilesUpdate && !onBeforeFilesUpdate(newFiles)) {
        return
      }
      onFilesUpdate(newFiles)
    }
  }

  return (
    <Input
      type="file"
      onChange={handleNewFileUpload}
      title=""
      value=""
      tabIndex={-1}
      multiple={!!multiple}
      accept={accept || ''}
    />
  )
}
