import {
  Box,
  Button,
  Flex,
  IconAlertCircle,
  IconFileText,
  IconX,
  Shelf,
  Spinner,
  Stack,
  Text,
  useControlledState,
} from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

const UploadButton = styled(Text)<{ $active?: boolean }>`
  appearance: none;
  display: inline-block;
  padding: 7px 24px;

  border-radius: 40px;
  border: ${({ theme }) => `1px solid ${theme.colors.textPrimary}`};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  text-align: center;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
    color: ${({ theme }) => theme.colors.accentPrimary};
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

type FileUploadProps = {
  file?: File | string | null
  onFileChange?: (file: File | string | null) => void
  onClear?: () => void
  validate?: (file: File) => string | undefined
  errorMessage?: string
  accept?: string
  disabled?: boolean
  loading?: boolean
}

export function FileUpload({
  file: fileProp,
  onFileChange,
  onClear,
  validate,
  errorMessage: errorMessageProp,
  accept,
  disabled,
  loading,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useControlledState<File | string | null>(null, fileProp, onFileChange)
  const [error, setError] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    if (onClear) {
      onClear()
    }
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
    <Stack gap={1} width="100%" height={280}>
      <Box
        px={2}
        py={1}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragEnd}
        onDrop={handleDrop}
        width="100%"
        height="100%"
        borderRadius="card"
        borderStyle="dashed"
        borderWidth={1}
        borderColor={disabled ? 'borderPrimary' : dragOver ? 'accentPrimary' : 'textSecondary'}
        backgroundColor="backgroundSecondary"
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
        <Stack gap={4} height="100%" justifyContent="center" alignItems="center">
          {curFile ? (
            <>
              <Shelf gap={1}>
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

                {!disabled && <Button variant="tertiary" onClick={handleClear} icon={IconX} disabled={disabled} />}
              </Shelf>
            </>
          ) : (
            <>
              <Stack gap={1} alignItems="center">
                <Text as="span" variant="body1" textAlign="center">
                  Drop a file to upload
                  <br />
                  or
                </Text>
                <UploadButton
                  forwardedAs="button"
                  variant="body1"
                  fontWeight={500}
                  onClick={handleUploadBtnClick}
                  disabled={disabled}
                  type="button"
                >
                  Choose file
                </UploadButton>
              </Stack>

              <Text as="span" variant="body2" textAlign="center" color="textDisabled">
                Supported file type: .pdf
              </Text>
            </>
          )}
        </Stack>
      </Box>

      {errorMessage && (
        <Box role="alert">
          <Text as="strong" variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}
