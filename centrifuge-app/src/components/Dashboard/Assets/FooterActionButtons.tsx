import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, IconWarning, Text } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { useCallback, useMemo } from 'react'
import { usePoolAdmin, useSuitableAccounts } from '../../../utils/usePermissions'
import { CreateAssetFormValues } from './CreateAssetsDrawer'

export const FooterActionButtons = ({
  type,
  setType,
  setOpen,
  isUploadingTemplates,
  resetToDefault,
  isLoading,
}: {
  type: string
  setType: (type: 'create-asset' | 'upload-template') => void
  setOpen: (open: boolean) => void
  isUploadingTemplates: boolean
  resetToDefault: () => void
  isLoading: boolean
}) => {
  const form = useFormikContext<CreateAssetFormValues>()
  const pool = form.values.selectedPool
  const isCash = form.values.assetType === 'cash'
  const poolAdmin = usePoolAdmin(pool?.id ?? '')
  const loanTemplates = pool?.meta?.loanTemplates || []
  const [account] = useSuitableAccounts({ poolId: pool?.id ?? '', poolRole: ['PoolAdmin'] })

  const canCreateAssets =
    useSuitableAccounts({ poolId: pool?.id, poolRole: ['Borrower', 'PoolAdmin'], proxyType: ['Borrow', 'PoolAdmin'] })
      .length > 0

  const hasTemplates = loanTemplates.length > 0
  const isAdmin = !!poolAdmin

  const { execute: updateTemplatesTx, isLoading: isTemplatesTxLoading } = useCentrifugeTransaction(
    'Create asset template',
    (cent) => cent.pools.setMetadata,
    {
      onSuccess: () => resetToDefault(),
    }
  )

  const uploadTemplates = useCallback(() => {
    const loanTemplatesPayload = form.values.uploadedTemplates.map((template) => ({
      id: template.id,
      createdAt: template.createdAt || new Date().toISOString(),
    }))

    const newPoolMetadata = {
      ...(pool?.meta as PoolMetadata),
      loanTemplates: loanTemplatesPayload,
    }

    updateTemplatesTx([pool?.id, newPoolMetadata], { account })
  }, [form.values.uploadedTemplates, pool?.meta, pool?.id, account, updateTemplatesTx])

  const createButton = useMemo(() => {
    // If the mode is 'upload-template', show a Save button.
    if (type === 'upload-template') {
      return (
        <Box width="100%">
          <Button
            loading={isTemplatesTxLoading || isUploadingTemplates}
            disabled={form.values.uploadedTemplates.length === 0 || !isAdmin}
            style={{ width: '100%', marginBottom: 8 }}
            onClick={uploadTemplates}
          >
            Save
          </Button>
        </Box>
      )
    }

    // If the asset type is cash, no template is needed.
    if (isCash) {
      return (
        <Button
          style={{ width: '100%' }}
          disabled={!form.values.assetName || !canCreateAssets}
          loading={isLoading}
          onClick={() => {
            form.submitForm()
          }}
        >
          Create
        </Button>
      )
    }

    // For non-cash asset types:
    if (hasTemplates) {
      // Templates exist: allow both admins and borrowers to create assets.
      return (
        <Button
          style={{ width: '100%' }}
          disabled={!form.values.assetName || !canCreateAssets}
          loading={isLoading}
          onClick={() => {
            form.submitForm()
          }}
        >
          Create
        </Button>
      )
    } else {
      // No templates exist.
      if (isAdmin) {
        // Admins can upload a template.
        return (
          <Box width="100%">
            <Button
              disabled={!form.values.assetName}
              loading={isLoading}
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => setType('upload-template')}
            >
              Upload asset template
            </Button>
            <Text variant="body3" color="textSecondary">
              Template must be in .JSON format. 5MB size limit
            </Text>
          </Box>
        )
      } else {
        // Borrowers cannot upload a template – show a warning message.
        return (
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <IconWarning size={24} />
              <Text variant="heading2" style={{ marginLeft: 8 }}>
                Asset template required
              </Text>
            </Box>
            <Text variant="body2">
              The pool manager needs to add an asset template before any new assets can be created.
            </Text>
          </Box>
        )
      }
    }
  }, [
    type,
    form,
    isCash,
    hasTemplates,
    isAdmin,
    setType,
    isLoading,
    isTemplatesTxLoading,
    isUploadingTemplates,
    uploadTemplates,
  ])

  return (
    <Box display="flex" flexDirection="column" mt={3} width="90%" position="absolute" bottom={0}>
      <Box flexGrow={1}>{createButton}</Box>
      <Box mt={2} flexGrow={1}>
        <Button variant="inverted" onClick={() => setOpen(false)} style={{ width: '100%' }}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
