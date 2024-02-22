import * as React from 'react'
import styled from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import IconUpload from '../../icon/IconUpload'
import IconX from '../../icon/IconX'
import { Size } from '../../utils/types'
import { useControlledState } from '../../utils/useControlledState'
import { Box } from '../Box'
import { Button } from '../Button'
import { Divider } from '../Divider'
import { FileUploadProps } from '../FileUpload'
import { Flex } from '../Flex'
import { Grid } from '../Grid'
import { InputUnit } from '../InputUnit'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

const UploadButton = styled.button<{ $active?: boolean }>`
  // Absolutely positioned, to avoid nesting the clear button in this one
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  border: none;
  background: transparent;
  appearance: none;
  cursor: pointer;
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

const Container = styled(Grid)<{ $disabled?: boolean; $active: boolean }>`
  position: relative;
  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    border: ${({ theme, $disabled, $active }) =>
      $disabled
        ? `1px dashed ${theme.colors.borderSecondary}`
        : $active
        ? `1px solid ${theme.colors.accentPrimary}`
        : `1px dashed ${theme.colors.borderPrimary}`};
    border-radius: 10px;
    z-index: 1;
    pointer-events: none;
  }
  &:hover::before,
  &:has(:focus-visible)::before {
    border: ${({ theme, $disabled }) => !$disabled && `1px solid ${theme.colors.accentPrimary}`};
  }
`

export type ImageUploadProps = Omit<FileUploadProps, 'file' | 'height'> & {
  file?: File | null
  requirements?: string
  height?: ResponsiveValue<Size>
  buttonLabel?: string
}

export function ImageUpload({
  id,
  file: fileProp,
  onFileChange,
  validate,
  errorMessage: errorMessageProp,
  accept = 'image/*',
  disabled,
  label,
  secondaryLabel,
  requirements,
  height,
  placeholder = 'Drag a file here',
  buttonLabel = 'Choose file',
  ...inputProps
}: ImageUploadProps) {
  const defaultId = React.useId()
  id ??= defaultId
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useControlledState<File | null>(null, fileProp, onFileChange)
  const [error, setError] = React.useState<string>()
  const [fileUrl, setFileUrl] = React.useState('')
  const [dragOver, setDragOver] = React.useState(false)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    setError(undefined)
    setCurFile(null)
    if (fileUrl) {
      setFileUrl('')
    }
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

  React.useEffect(() => {
    if (!curFile) return
    const url = URL.createObjectURL(curFile)
    setFileUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [curFile])

  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
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
          <Container
            display="grid"
            alignItems="stretch"
            gridTemplateColumns="100%"
            gridTemplateRows="auto"
            gridTemplateAreas="'unit'"
            minHeight={height}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragEnd}
            onDrop={handleDrop}
            $active={dragOver}
            $disabled={disabled}
          >
            <UploadButton onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver} />
            <Stack
              gap={2}
              gridArea="unit"
              justifySelf="stretch"
              alignItems="center"
              justifyContent="center"
              borderRadius="10px"
              position="relative"
              p={3}
              style={{ opacity: fileUrl ? 0 : 1 }}
            >
              <Stack gap={1} alignItems="center" justifyContent="center" width="max-content">
                <IconUpload size="iconMedium" />
                <Text variant="heading3">{placeholder}</Text>
                {requirements && <Text variant="label2">{requirements}</Text>}
              </Stack>
              <Button onClick={handleUploadBtnClick} variant="secondary" style={{ zIndex: 3 }}>
                {buttonLabel}
              </Button>
            </Stack>
            <Stack p={2} gridArea="unit" justifySelf="stretch" style={{ visibility: fileUrl ? 'visible' : 'hidden' }}>
              <Shelf px={1} pb={1} justifyContent="space-between">
                <Text
                  variant="body1"
                  color={disabled ? 'textDisabled' : 'textPrimary'}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'rtl',
                  }}
                >
                  {curFile && (typeof curFile === 'string' ? curFile : curFile.name)}
                </Text>
                <Flex display="flex" zIndex="3" bleedY={2} bleedX={2}>
                  {!disabled && <Button variant="tertiary" onClick={handleClear} icon={IconX} disabled={disabled} />}
                </Flex>
              </Shelf>
              <Divider borderColor="borderSecondary" />
              <Stack mt={2} flex={1} minHeight={60} position="relative">
                {fileUrl && (
                  <Box
                    as="img"
                    src={fileUrl}
                    position="absolute"
                    width="100%"
                    height="100%"
                    top={0}
                    left={0}
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </Stack>
            </Stack>
          </Container>
        </>
      }
    />
  )
}
