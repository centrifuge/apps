import React, { useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import IconAlertCircle from '../../icon/IconAlertCircle'
import IconCheckCircle from '../../icon/IconCheckCircle'
import IconPlus from '../../icon/IconPlus'
import IconSpinner from '../../icon/IconSpinner'
import IconX from '../../icon/IconX'
import { Box } from '../Box'
import { Button } from '../Button'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

const rotate = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
`

const FileUploadContainer = styled(Stack)<{ $disabled?: boolean }>`
  position: relative;
  height: 64px;
  justify-content: center;
  width: 100%;
  outline: 1px dashed ${({ theme, $disabled }) => ($disabled ? theme.colors.textDisabled : theme.colors.textSecondary)};
  outline-offset: -1px;
  border-radius: ${({ theme }) => theme.radii.card}px;
  cursor: pointer;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'initial')};
`

const UploadButton = styled.button<{ $active?: boolean }>`
  // Absolutely positioned, to avoid nesting the clear button in this one
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.card}px;
  background: transparent;
  appearance: none;
  transition: border-color 100ms ease-in-out, color 100ms ease-in-out;
  cursor: pointer;

  &:focus-visible,
  &:hover {
    color: ${({ theme }) => theme.colors.accentPrimary};
    border-color: currentcolor;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.accentPrimary};
      border-color: currentcolor;
    `}
`

const FormField = styled.input`
  // Visually hidden
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`

const Spinner = styled(IconSpinner)`
  animation: ${rotate} 600ms linear infinite;
`

type FileUploadProps = {
  onFileUpdate: (file: File) => void
  onFileCleared: () => void
  validate: (file: File) => string | undefined
  errorMessage?: string
  accept?: string
  disabled?: boolean
  placeholder: string
  loading?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpdate,
  onFileCleared,
  validate,
  errorMessage: errorMessageProp,
  accept,
  disabled,
  loading,
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    setError(null)
    setCurFile(null)
    onFileCleared?.()
  }

  async function handleNewFile(newFile: File) {
    if (curFile) {
      handleClear()
    }

    const newError = validate?.(newFile)

    if (newError) {
      setError(newError)
      return
    }

    setCurFile(newFile)
    onFileUpdate(newFile)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { files: newFiles } = e.target
    if (newFiles?.length) {
      const newFile = newFiles[0]
      handleNewFile(newFile)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const { files: newFiles } = e.dataTransfer
    if (newFiles?.length) {
      const newFile = newFiles[0]
      handleNewFile(newFile)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  function handleDragEnd() {
    setDragOver(false)
  }

  return (
    <FileUploadContainer
      $disabled={disabled}
      px={2}
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragEnd={handleDragEnd}
      onDragLeave={handleDragEnd}
      onDrop={handleDrop}
    >
      <FormField
        type="file"
        accept={accept}
        onChange={handleFileChange}
        value=""
        disabled={disabled}
        tabIndex={-1}
        ref={inputRef}
      />
      {errorMessage ? (
        <>
          <Shelf gap={2}>
            <UploadButton type="button" onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver} />
            <Flex minWidth="iconMedium">
              <IconAlertCircle color="statusCritical" />
            </Flex>
            <Text variant="body1" color={disabled ? 'textDisabled' : 'textPrimary'}>
              {errorMessage}
            </Text>
            <Box position="relative" zIndex={1} ml="auto" minWidth="iconMedium">
              <Button variant="text" onClick={handleClear} icon={IconX} disabled={disabled} />
            </Box>
          </Shelf>
        </>
      ) : curFile ? (
        <>
          <Shelf gap={2}>
            <UploadButton type="button" onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver} />
            <Flex minWidth="iconMedium">
              {loading ? (
                <Spinner color={disabled ? 'textDisabled' : 'textPrimary'} />
              ) : (
                <IconCheckCircle color={disabled ? 'textDisabled' : 'textPrimary'} />
              )}
            </Flex>
            <Text
              variant="body1"
              color={disabled ? 'textDisabled' : 'textPrimary'}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {curFile.name}
            </Text>
            <Box position="relative" zIndex={1} ml="auto" minWidth="iconMedium">
              <Button variant="text" onClick={handleClear} icon={IconX} disabled={disabled} />
            </Box>
          </Shelf>
        </>
      ) : (
        <UploadButton type="button" onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver}>
          <Shelf gap={1}>
            <IconPlus />
            <Text variant="body1" color="currentcolor">
              {placeholder}
            </Text>
          </Shelf>
        </UploadButton>
      )}
    </FileUploadContainer>
  )
}
