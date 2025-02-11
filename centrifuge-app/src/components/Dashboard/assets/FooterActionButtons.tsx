import { Box, Button, IconWarning, Text } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { useMemo } from 'react'
import { usePoolAdmin } from '../../../../src/utils/usePermissions'
import { CreateAssetFormValues, PoolWithMetadata } from './CreateAssetsDrawer'

export const FooterActionButtons = ({
  pool,
  type,
  setType,
  setOpen,
}: {
  pool: PoolWithMetadata
  type: string
  setType: (type: 'create-asset' | 'upload-template') => void
  setOpen: (open: boolean) => void
}) => {
  const form = useFormikContext<CreateAssetFormValues>()
  const isCash = form.values.assetType === 'cash'
  const poolAdmin = usePoolAdmin(pool?.id ?? '')
  const loanTemplates = pool?.meta?.loanTemplates || []

  const hasTemplates = loanTemplates.length > 0
  const isAdmin = !!poolAdmin

  const createButton = useMemo(() => {
    // If the mode is 'upload-template', show a Save button.
    if (type === 'upload-template') {
      return (
        <Box width="100%">
          <Button disabled={!form.values.assetName} style={{ width: '100%', marginBottom: 8 }}>
            Save
          </Button>
        </Box>
      )
    }

    // If the asset type is cash, no template is needed.
    if (isCash) {
      return (
        <Button style={{ width: '100%' }} disabled={!form.values.assetName}>
          Create
        </Button>
      )
    }

    // For non-cash asset types:
    if (hasTemplates) {
      // Templates exist: allow both admins and borrowers to create assets.
      return (
        <Button style={{ width: '100%' }} disabled={!form.values.assetName}>
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
  }, [type, form.values.assetName, form.values.assetType, isCash, hasTemplates, isAdmin, setType, loanTemplates])

  return (
    <Box display="flex" flexDirection="column" mt={3}>
      <Box flexGrow={1}>{createButton}</Box>
      <Box mt={2} flexGrow={1}>
        <Button variant="inverted" onClick={() => setOpen(false)} style={{ width: '100%' }}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
