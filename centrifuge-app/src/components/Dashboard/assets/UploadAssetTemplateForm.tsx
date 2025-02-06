import { AnchorButton, Box, FileUploadButton, IconDownload, IconFile, IconPlus, Text } from '@centrifuge/fabric'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'styled-components'
import { createDownloadJson } from '../../../utils/createDownloadJson'
import { useAssetsContext } from './AssetsContext'

interface UploadedFile {
  id: string
  file: File
  url: string
  fileName: string
}

interface DownloadItem {
  id: string
  name: string
  url: string
  downloadFileName: string
  revoke?: () => void
}

export const UploadAssetTemplateForm = () => {
  const theme = useTheme()
  const { templatesData } = useAssetsContext()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const templateDownloadItems: DownloadItem[] = useMemo(() => {
    return templatesData.map((template) => {
      const info = createDownloadJson(template, `loan-template-${template.id}.json`)
      return {
        id: template.id,
        name: template.name,
        url: info.url,
        downloadFileName: info.fileName,
        revoke: info.revoke,
      }
    })
  }, [templatesData])

  useEffect(() => {
    return () => {
      templateDownloadItems.forEach((item) => item.revoke && item.revoke())
    }
  }, [templateDownloadItems])

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((upload) => URL.revokeObjectURL(upload.url))
    }
  }, [uploadedFiles])

  const allDownloadItems: DownloadItem[] = useMemo(() => {
    const uploadedItems: DownloadItem[] = uploadedFiles.map((upload) => ({
      id: upload.id,
      name: upload.fileName,
      url: upload.url,
      downloadFileName: upload.fileName,
    }))
    return [...templateDownloadItems, ...uploadedItems]
  }, [templateDownloadItems, uploadedFiles])

  return (
    <Box display="flex" flexDirection="column" justifyContent="flex-start">
      {allDownloadItems.map((item) => (
        <Box
          key={item.id}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={2}
          py={3}
          mb={2}
          borderRadius={8}
          border={`1px solid ${theme.colors.borderPrimary}`}
        >
          <Box display="flex" alignItems="center">
            <IconFile />
            <Text variant="heading4" ml={2}>
              {item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}
            </Text>
          </Box>
          <AnchorButton
            href={item.url}
            target="_blank"
            variant="tertiary"
            icon={<IconDownload size={18} />}
            small
            download={item.downloadFileName}
          />
        </Box>
      ))}

      <Box>
        <FileUploadButton
          accept=".json"
          allowedFileTypes={['application/json']}
          maxFileSize={5000000} // 5 MB
          icon={<IconPlus />}
          small
          text={allDownloadItems.length ? 'Upload another template' : 'Upload asset template'}
          onFileChange={(files) => {
            const newUploads: UploadedFile[] = Array.from(files).map((file) => {
              const url = URL.createObjectURL(file)
              const id = `${file.name}-${Date.now()}`
              return { id, file, url, fileName: file.name }
            })
            setUploadedFiles((prev) => [...prev, ...newUploads])
          }}
        />
      </Box>
    </Box>
  )
}
