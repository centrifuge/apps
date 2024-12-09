import * as React from 'react'
import styled from 'styled-components'
import { Box, IconUpload, InputUnit, InputUnitProps, StyledTextInput, Text } from '../..'
import { useControlledState } from '../../utils/useControlledState'
import { Stack } from '../Stack'

// const rotate = keyframes`
//   0% {
//     transform: rotate(0);
//   }
//   100% {
//     transform: rotate(1turn);
//   }
// `

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

// const Spinner = styled(IconSpinner)`
//   animation: ${rotate} 600ms linear infinite;
// `

const FileDragOverContainer = styled(Stack)<{ $disabled?: boolean; $active: boolean; small?: boolean }>`
  position: relative;
  height: ${({ small }) => (small ? '40px' : '144px')};
  background-color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.borderPrimary};
  border-radius: ${({ theme }) => theme.radii.input}px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  padding: 16px;
  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    box-shadow: ${({ theme, $disabled, $active }) =>
      $active && !$disabled && `inset 0 0 0 1px ${theme.colors.accentPrimary}`};
    border-radius: ${({ theme }) => theme.radii.input}px;
    z-index: 1;
    pointer-events: none;
  }
`

const FileInputContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  padding: 16px 24px;
  border-radius: ${({ theme }) => theme.radii.input}px;
  background-color: #ffffff;
`

export type FileUploadProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> &
  InputUnitProps & {
    file?: File | string | null
    onFileChange?: (file: File | null) => void
    onClear?: () => void
    validate?: (file: File) => string | undefined
    loading?: boolean
    fileTypeText?: string
    small?: boolean
  }

export function FileUpload({
  file: fileProp,
  onFileChange,
  onClear,
  validate,
  errorMessage: errorMessageProp,
  disabled,
  loading,
  placeholder,
  label,
  secondaryLabel,
  id,
  fileTypeText,
  small,
  ...inputProps
}: FileUploadProps) {
  const defaultId = React.useId()
  id ??= defaultId
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useControlledState<File | string | null>(null, fileProp, onFileChange)
  const [error, setError] = React.useState<string | undefined>(undefined)
  const [dragOver, setDragOver] = React.useState(false)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    if (onClear) {
      onClear()
    }
    setError(undefined)
    setCurFile(null)
  }

  async function handleNewFile(newFile: File) {
    setError(undefined)

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

  function handleContainerClick() {
    if (!disabled) {
      handleUploadBtnClick()
    }
  }

  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <FileDragOverContainer
          onClick={handleContainerClick}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragEnd}
          onDrop={handleDrop}
          $active={dragOver}
          $disabled={disabled}
          small={small}
        >
          {small && (
            <Box display="flex" justifyContent="space-between" width="100%">
              <Text color={curFile && typeof curFile !== 'string' && curFile.name ? 'textPrimary' : 'textSecondary'}>
                {' '}
                {(curFile && typeof curFile !== 'string' && curFile.name) || 'Click to upload'}
              </Text>
              <IconUpload size={20} />
            </Box>
          )}
          {!small && (
            <FileInputContent>
              <Box
                backgroundColor="backgroundSecondary"
                borderRadius="100%"
                height={40}
                width={40}
                display="flex"
                justifyContent="center"
                alignItems="center"
                marginBottom={16}
              >
                <IconUpload size={20} />
              </Box>
              <Box>
                <Text variant="heading4">
                  {(curFile && typeof curFile !== 'string' && curFile.name) || 'Click to upload'}
                </Text>
                {curFile && typeof curFile !== 'string' && curFile.name ? (
                  ''
                ) : (
                  <Text variant="body2" color="textSecondary">
                    {' '}
                    or drag and drop
                  </Text>
                )}
              </Box>
              {curFile && typeof curFile !== 'string' && curFile.name ? (
                ''
              ) : (
                <Text variant="body3">{fileTypeText}</Text>
              )}
              <StyledTextInput
                readOnly
                value={curFile ? (typeof curFile === 'string' ? curFile : curFile.name) : ''}
                style={{ cursor: 'pointer', flex: 1, opacity: 0 }}
              />
            </FileInputContent>
          )}
          <FormField
            id={id}
            type="file"
            onChange={handleFileChange}
            value=""
            disabled={disabled}
            tabIndex={-1}
            ref={inputRef}
            {...inputProps}
          />
        </FileDragOverContainer>
      }
    />
  )
}
