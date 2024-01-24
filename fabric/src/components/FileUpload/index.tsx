import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { InputAction, InputUnit, InputUnitProps, StyledTextInput, TextInputBox } from '../..'
import IconSpinner from '../../icon/IconSpinner'
import IconX from '../../icon/IconX'
import { useControlledState } from '../../utils/useControlledState'
import { Button } from '../Button'
import { Flex } from '../Flex'
import { Stack } from '../Stack'

const rotate = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
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

const FileDragOverContainer = styled(Stack)<{ $disabled?: boolean; $active: boolean }>`
  position: relative;
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

export type FileUploadProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> &
  InputUnitProps & {
    file?: File | string | null
    onFileChange?: (file: File | null) => void
    onClear?: () => void
    validate?: (file: File) => string | undefined
    loading?: boolean
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

  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      active={dragOver}
      inputElement={
        <FileDragOverContainer
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragEnd}
          onDrop={handleDrop}
          $active={dragOver}
          $disabled={disabled}
        >
          <TextInputBox
            disabled={disabled}
            error={!!errorMessage}
            inputElement={
              <>
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
                <StyledTextInput
                  readOnly
                  onClick={handleUploadBtnClick}
                  value={curFile ? (typeof curFile === 'string' ? curFile : curFile.name) : ''}
                  placeholder={placeholder}
                  style={{ cursor: 'pointer' }}
                />
              </>
            }
            symbol={
              loading ? (
                <Spinner size="iconSmall" color={disabled ? 'textDisabled' : 'textPrimary'} />
              ) : curFile && !disabled ? (
                <Flex bleedX="10px">
                  <Button variant="tertiary" small onClick={handleClear} icon={IconX} disabled={disabled} />
                </Flex>
              ) : null
            }
            action={
              <InputAction onClick={handleUploadBtnClick} disabled={disabled}>
                Choose file
              </InputAction>
            }
          />
        </FileDragOverContainer>
      }
    />
  )
}
