import React, { useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { IconFileText } from '../..'
import IconAlertCircle from '../../icon/IconAlertCircle'
import IconSpinner from '../../icon/IconSpinner'
import IconUpload from '../../icon/IconUpload'
import IconX from '../../icon/IconX'
import useControlledState from '../../utils/useControlledState'
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
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme, $disabled }) => ($disabled ? theme.colors.backgroundPage : theme.colors.backgroundInput)};
  /* outline: 1px dashed
    ${({ theme, $disabled }) => ($disabled ? theme.colors.backgroundSecondary : theme.colors.borderPrimary)};
  outline-offset: -1px; */
  border-radius: ${({ theme }) => theme.radii.card}px;
  cursor: pointer;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'initial')};
`

const AddButton = styled(Shelf)`
  transition: color 100ms ease-in-out;
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
  border: ${({ theme, disabled }) =>
    disabled ? `1px solid ${theme.colors.borderSecondary}` : `1px dashed ${theme.colors.borderPrimary}`};
  border-radius: ${({ theme }) => theme.radii.card}px;
  background: transparent;
  appearance: none;
  transition: border-color 100ms ease-in-out, color 100ms ease-in-out;
  cursor: pointer;

  &:disabled,
  &:hover {
    & + ${AddButton} {
      color: ${({ theme }) => theme.colors.textDisabled};
    }
  }

  &:focus-visible,
  &:hover {
    color: ${({ theme }) => theme.colors.accentPrimary};
    border-color: currentcolor;

    & + ${AddButton} {
      color: ${({ theme }) => theme.colors.accentPrimary};
    }
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      color: ${theme.colors.accentPrimary};
      border-color: currentcolor;
      & + ${AddButton} {
        color: ${theme.colors.accentPrimary};
      }
    `}
`
UploadButton.defaultProps = {
  type: 'button',
}

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
  file?: File | string | null
  onFileChange?: (file: File | null) => void
  validate?: (file: File) => string | undefined
  errorMessage?: string
  accept?: string
  disabled?: boolean
  placeholder: string
  loading?: boolean
  label?: React.ReactNode
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file: fileProp,
  onFileChange,
  validate,
  errorMessage: errorMessageProp,
  accept,
  disabled,
  loading,
  placeholder,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useControlledState<File | string | null>(null, fileProp, onFileChange)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    setError(null)
    setCurFile(null)
  }

  async function handleNewFile(newFile: File) {
    setError(null)

    if (curFile) {
      handleClear()
    }

    const newError = validate?.(newFile)

    if (newError) {
      setError(newError)
      return
    }

    setCurFile(newFile)
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
    <Stack gap={1} width="100%">
      <FileUploadContainer
        $disabled={disabled}
        px={2}
        py={1}
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
        <Stack gap="4px" height="100%">
          {label && (
            <Text variant="label2" color={disabled ? 'textDisabled' : 'textSecondary'}>
              {label}
            </Text>
          )}
          {curFile ? (
            <>
              <Shelf gap={1} my="auto">
                <UploadButton onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver} />
                <Flex minWidth="iconMedium">
                  {loading ? (
                    <Spinner color={disabled ? 'textDisabled' : 'textPrimary'} />
                  ) : errorMessage ? (
                    <IconAlertCircle color={disabled ? 'textDisabled' : 'textPrimary'} />
                  ) : (
                    <IconFileText color={disabled ? 'textDisabled' : 'textPrimary'} />
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
                  {typeof curFile === 'string' ? curFile : curFile.name}
                </Text>
                <Box
                  display="flex"
                  position="relative"
                  zIndex="1"
                  ml="auto"
                  my="-10px"
                  mr="-10px"
                  minWidth="iconMedium"
                >
                  {!disabled && <Button variant="tertiary" onClick={handleClear} icon={IconX} disabled={disabled} />}
                </Box>
              </Shelf>
            </>
          ) : (
            <>
              <UploadButton onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver}></UploadButton>
              <AddButton gap={1} justifyContent="center" m="auto">
                <IconUpload />
                <Text variant="body1" color="currentcolor">
                  {placeholder}
                </Text>
              </AddButton>
            </>
          )}
        </Stack>
      </FileUploadContainer>

      {errorMessage && (
        <Box px={2}>
          <Text variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}
