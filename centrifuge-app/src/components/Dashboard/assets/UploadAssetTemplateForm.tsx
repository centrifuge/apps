import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  FileUploadButton,
  IconDownload,
  IconFile,
  IconPlus,
  IconWarning,
  Text,
} from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { useMemo } from 'react'
import { lastValueFrom } from 'rxjs'
import { LoanTemplate } from 'src/types'
import { useTheme } from 'styled-components'
import { useMetadataMulti } from '../../../../src/utils/useMetadata'
import { createDownloadJson } from '../../../utils/createDownloadJson'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { CreateAssetFormValues, UploadedTemplate } from './CreateAssetsDrawer'

export interface UploadedFile {
  id: string
  file: File
  url: string
  fileName: string
  data: any
  downloadUrl: string
  name: string
}

interface DownloadItem {
  id: string
  name: string
  url: string
  downloadFileName: string
  revoke?: () => void
}

export const UploadAssetTemplateForm = ({
  setIsUploadingTemplates,
}: {
  setIsUploadingTemplates: (isUploadingTemplates: boolean) => void
}) => {
  const theme = useTheme()
  const cent = useCentrifuge()
  const form = useFormikContext<CreateAssetFormValues>()
  const selectedPool = form.values.selectedPool
  const uploadedFiles: UploadedTemplate[] = form.values.uploadedTemplates
  const templateIds = useMemo(() => {
    return uploadedFiles.map((s: { id: string }) => s.id)
  }, [uploadedFiles])
  const templatesMetadataResults = useMetadataMulti<LoanTemplate>(templateIds)
  const templatesMetadata = templatesMetadataResults.filter(Boolean)
  const poolAdmin = usePoolAdmin(form.values.selectedPool?.id)

  const templatesData = useMemo(() => {
    return templateIds.map((id, i) => {
      const meta = templatesMetadata[i].data
      const metaMeta = selectedPool?.meta?.loanTemplates?.[i]
      return {
        id,
        name: `Version ${i + 1}`,
        createdAt: metaMeta?.createdAt ? new Date(metaMeta?.createdAt) : null,
        data: meta,
      }
    })
  }, [templateIds, templatesMetadata, selectedPool])

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

  const pinFiles = async (newUpload: UploadedFile) => {
    setIsUploadingTemplates(true)
    try {
      const templateMetadataHash = await lastValueFrom(cent.metadata.pinJson(newUpload.data))
      const updatedUpload = { id: templateMetadataHash.ipfsHash, createdAt: new Date().toISOString() }
      form.setFieldValue('uploadedTemplates', [...form.values.uploadedTemplates, updatedUpload])
      setIsUploadingTemplates(false)
    } catch (error) {
      console.error('Error pinning template:', error)
      setIsUploadingTemplates(false)
    }
  }

  return (
    <Box display="flex" flexDirection="column" justifyContent="flex-start">
      {templateDownloadItems.map((item) => (
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
              {item?.name?.length > 20 ? `${item.name.slice(0, 20)}...` : item?.name}
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
        {!!poolAdmin ? (
          <FileUploadButton
            accept=".json"
            allowedFileTypes={['application/json']}
            maxFileSize={5000000} // 5 MB
            icon={<IconPlus />}
            small
            text={templateDownloadItems.length ? 'Upload another template' : 'Upload asset template'}
            onFileChange={(files) => {
              Array.from(files).forEach((file) => {
                const reader = new FileReader()
                reader.onload = (event) => {
                  try {
                    const text = event.target?.result as string
                    const parsedData = JSON.parse(text)
                    if (typeof parsedData !== 'object' || parsedData === null) {
                      throw new Error('Uploaded JSON is not a valid object.')
                    }
                    const blob = new Blob([JSON.stringify(parsedData, null, 2)], {
                      type: 'application/json',
                    })
                    const downloadUrl = URL.createObjectURL(blob)
                    const url = URL.createObjectURL(file)
                    const id = `${file.name}-${Date.now()}`
                    const newUpload: UploadedFile = {
                      id,
                      file,
                      url,
                      fileName: file.name,
                      data: parsedData,
                      downloadUrl,
                      name: file.name,
                    }
                    pinFiles(newUpload)
                  } catch (error) {
                    alert(`Error parsing file "${file.name}": ${error instanceof Error ? error.message : error}`)
                  }
                }
                reader.readAsText(file)
              })
            }}
          />
        ) : (
          <Box display="flex" alignItems="center" mb={1}>
            <IconWarning size={24} />
            <Text variant="body2">Only pool admins can upload asset templates.</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
