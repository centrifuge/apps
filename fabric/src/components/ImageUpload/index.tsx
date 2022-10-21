import * as React from 'react'
import styled, { css } from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import IconUpload from '../../icon/IconUpload'
import IconX from '../../icon/IconX'
import { Size } from '../../utils/types'
import useControlledState from '../../utils/useControlledState'
import { Box } from '../Box'
import { Button } from '../Button'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

const AddButton = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textDisabled};
  transition: 100ms ease-in-out;
`

const PreviewPlaceholder = styled(Flex)<{ $active?: boolean; $disabled?: boolean; $visible?: boolean }>`
  color: ${({ $active, $disabled, theme }) =>
    $disabled ? theme.colors.textDisabled : $active ? theme.colors.accentPrimary : theme.colors.textPrimary};
  background-color: ${({ $disabled, theme }) => ($disabled ? 'transparent' : theme.colors.backgroundSecondary)};
  transition: border-color 100ms ease-in-out, color 100ms ease-in-out;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  border: 1px dashed
    ${({ theme, $disabled }) => ($disabled ? theme.colors.borderSecondary : theme.colors.borderPrimary)};
`

const ImageUploadContainer = styled(Stack)<{ $disabled?: boolean }>`
  position: relative;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme, $disabled }) => ($disabled ? 'transparent' : theme.colors.backgroundInput)};
  box-shadow: ${({ theme, $disabled }) => ($disabled ? `inset 0 0 0 1px ${theme.colors.borderSecondary}` : 'none')};
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
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: transparent;
  appearance: none;
  cursor: pointer;

  &:focus-visible,
  &:hover {
    & + * ${PreviewPlaceholder} {
      color: ${({ theme }) => theme.colors.accentPrimary};
      border-color: currentcolor;
    }
    & ~ * ${AddButton} {
      color: ${({ theme }) => theme.colors.accentPrimary};
    }
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      & + * ${PreviewPlaceholder} {
        color: ${theme.colors.accentPrimary};
        border-color: currentcolor;
      }
      & ~ * ${AddButton} {
        color: ${({ theme }) => theme.colors.accentPrimary};
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

type ImageUploadProps = {
  file?: File | null
  onFileChange?: (file: File | null) => void
  validate?: (file: File) => string | undefined
  errorMessage?: string
  accept?: string
  disabled?: boolean
  placeholder?: string
  loading?: boolean
  label?: React.ReactNode
  aspectRatio?: ResponsiveValue<string>
  requirements?: string
  height?: ResponsiveValue<Size>
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  file: fileProp,
  onFileChange,
  validate,
  errorMessage: errorMessageProp,
  accept = 'image/*',
  disabled,
  label,
  aspectRatio = '1 / 1',
  requirements,
  height,
  placeholder = 'Not set',
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [curFile, setCurFile] = useControlledState<File | null>(null, fileProp, onFileChange)
  const [error, setError] = React.useState<string | null>(null)
  const [fileUrl, setFileUrl] = React.useState('')
  const [dragOver, setDragOver] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const observeRef = React.useRef<ResizeObserver | null>(null)

  const errorMessage = errorMessageProp || error

  function handleUploadBtnClick() {
    inputRef?.current?.click()
  }

  function handleClear() {
    setError(null)
    setCurFile(null)
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
      setFileUrl('')
    }
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

  React.useEffect(() => {
    if (!curFile) return
    const url = URL.createObjectURL(curFile)
    setFileUrl(url)
  }, [curFile])

  function handlePreviewMount(node: HTMLDivElement | null) {
    if (!node && observeRef.current) {
      observeRef.current.disconnect()
      observeRef.current = null
      return
    }
    const child = node?.querySelector('.large')
    if (node && child) {
      const obs = new ResizeObserver((entries) => {
        for (const entry of entries) {
          let width
          if (entry.contentBoxSize) {
            // Firefox implements `contentBoxSize` as a single content rect, rather than an array
            const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize
            width = contentBoxSize.inlineSize
          } else {
            width = entry.contentRect.width
          }
          if (width > child!.clientWidth + 20) {
            setVisible(true)
          } else {
            setVisible(false)
          }
        }
      })
      obs.observe(node)
      observeRef.current = obs
    }
  }

  return (
    <Stack gap={1} width="100%" height={height} minHeight="60px">
      <ImageUploadContainer
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
        <Shelf gap={2} height="100%">
          <UploadButton onClick={handleUploadBtnClick} disabled={disabled} $active={dragOver} />
          <Box
            display="grid"
            alignItems="stretch"
            gridTemplateColumns="100%"
            gridTemplateRows="auto"
            gridTemplateAreas="'unit'"
            flex="0 0 auto"
            aspectRatio={aspectRatio}
            alignSelf="stretch"
            ref={handlePreviewMount}
            minWidth={34}
            my="4px"
            // style={{ aspectRatio }}
          >
            <PreviewPlaceholder
              $active={dragOver}
              $disabled={disabled}
              $visible={!fileUrl}
              gridArea="unit"
              justifySelf="stretch"
              alignItems="center"
              justifyContent="center"
              borderRadius="input"
              position="relative"
            >
              <IconUpload size="iconSmall" style={{ opacity: visible ? 0 : 1 }} />
              <Stack
                gap={1}
                alignItems="center"
                justifyContent="center"
                width="max-content"
                position="absolute"
                top="50%"
                left="50%"
                style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: visible ? 1 : 0 }}
                className="large"
              >
                <Text variant="label2">Drop file to upload or</Text>
                <Shelf gap={1}>
                  <IconUpload size="iconSmall" />
                  <Text variant="body1" fontWeight={500} color="currentColor">
                    Choose image
                  </Text>
                </Shelf>
                {requirements && <Text variant="label2">{requirements}</Text>}
              </Stack>
            </PreviewPlaceholder>
            {fileUrl && (
              <Box
                gridArea="unit"
                justifySelf="stretch"
                borderRadius="input"
                backgroundImage={`url(${fileUrl})`}
                backgroundRepeat="no-repeat"
                backgroundPosition="center"
                backgroundSize="contain"
                backgroundColor="backgroundSecondary"
              />
            )}
          </Box>
          <Stack gap="4px" flex="1 1 auto" minWidth={0}>
            {label && (
              <Text variant="label2" color={disabled ? 'textDisabled' : 'textSecondary'}>
                {label}
              </Text>
            )}
            {curFile ? (
              <>
                <Shelf gap={1}>
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
                    {typeof curFile === 'string' ? curFile : curFile.name}
                  </Text>
                  <Box display="flex" position="relative" zIndex="3" ml="auto" my="-10px" mr="-10px" minWidth="40px">
                    {!disabled && <Button variant="tertiary" onClick={handleClear} icon={IconX} disabled={disabled} />}
                  </Box>
                </Shelf>
              </>
            ) : (
              <>
                <AddButton gap={1}>
                  <Text variant="body1" color="inherit">
                    {placeholder}
                  </Text>
                </AddButton>
              </>
            )}
          </Stack>
        </Shelf>
      </ImageUploadContainer>

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
