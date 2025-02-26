import { useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  FileUpload,
  Grid,
  IconDownload,
  IconFile,
  IconWarning,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { useMemo, useState } from 'react'
import { lastValueFrom } from 'rxjs'
import { LoanTemplate } from 'src/types'
import { useTheme } from 'styled-components'
import { createDownloadJson } from '../../../utils/createDownloadJson'
import { useMetadataMulti } from '../../../utils/useMetadata'
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

  const [errorMessage, setErrorMessage] = useState<string>('')

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
    <Stack flex={1} overflow="auto">
      {templateDownloadItems.length > 0 && (
        <Stack mt={1}>
          <Text variant="heading4">Asset template/s</Text>
          {templateDownloadItems.map((item) => (
            <Box
              key={item.id}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={2}
              py={3}
              mb={1}
              borderRadius={8}
              border={`1px solid ${theme.colors.borderPrimary}`}
              mt={1}
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
        </Stack>
      )}

      <Box mt={2}>
        {!!poolAdmin ? (
          <FileUpload
            errorMessage={errorMessage}
            accept="application/json"
            placeholder="Upload asset template"
            onFileChange={(file) => {
              if (!file) return

              // Check if file size exceeds 5MB (5 * 1024 * 1024 bytes)
              const maxSizeInBytes = 5 * 1024 * 1024
              if (file.size > maxSizeInBytes) {
                setErrorMessage('File size exceeds the 5MB limit.')
                return
              }
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
            }}
            file={null}
            fileTypeText="Template must be in .JSON format. 5MB size limit"
            label="Asset template"
          />
        ) : (
          <Grid display="flex" alignItems="center" mb={1} gap={1}>
            <IconWarning size={20} color={theme.colors.statusCritical} />
            <Text variant="heading4" color={theme.colors.statusCritical}>
              Only pool admins can upload asset templates.
            </Text>
          </Grid>
        )}
      </Box>
    </Stack>
  )
}
