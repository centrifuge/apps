import React, { useRef } from 'react'
import { Button, IconProps } from '../Button'

export interface IconTextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ComponentType<IconProps> | React.ReactElement
  text?: string
  small?: boolean
}

export const IconTextButton: React.FC<IconTextButtonProps> = ({ icon, text, small, ...props }) => {
  return (
    <Button variant="tertiary" {...props} icon={icon} small={small}>
      {text ?? 'Upload'}
    </Button>
  )
}

export interface FileUploadButtonProps extends Omit<IconTextButtonProps, 'onClick'> {
  accept?: string
  multiple?: boolean
  maxFileSize?: number
  allowedFileTypes?: string[]
  onFileChange?: (files: File[]) => void
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  accept,
  multiple = false,
  maxFileSize,
  allowedFileTypes,
  onFileChange,
  text,
  small,
  ...buttonProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFileChange) {
      const filesArray = Array.from(e.target.files)

      const validFiles = filesArray.filter((file) => {
        if (maxFileSize && file.size > maxFileSize) {
          return false
        }
        if (allowedFileTypes && allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
          return false
        }
        return true
      })

      onFileChange(validFiles)
    }
    e.target.value = ''
  }

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      <IconTextButton {...buttonProps} onClick={handleButtonClick} text={text} small={small} />
    </>
  )
}
