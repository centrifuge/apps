import { Box, Button, IconWarning, Text } from '@centrifuge/fabric'
import { useFormikContext } from 'formik'
import { usePoolAdmin } from '../../../../src/utils/usePermissions'
import { useAssetsContext } from './AssetsContext'
import { CreateAssetFormValues } from './CreateAssetsDrawer'

export const FooterActionButtons = () => {
  const { selectedPool: pool, canCreateAssets, setOpen, setType, type } = useAssetsContext()
  const form = useFormikContext<CreateAssetFormValues>()
  const isCash = form.values.assetType === 'cash'
  const poolAdmin = usePoolAdmin(pool?.id ?? '')

  const loanTemplates = pool?.meta?.loanTemplates || []

  const renderCreateButton = () => {
    const hasLoanTemplates = loanTemplates.length > 0
    const isPoolAdmin = !!poolAdmin

    if (type === 'upload-template') {
      return (
        <Box width="100%">
          <Button disabled={!form.values.assetName} style={{ width: '100%', marginBottom: 8 }}>
            Save
          </Button>
        </Box>
      )
    }

    if (poolAdmin && !isCash && !hasLoanTemplates) {
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
    }

    if (canCreateAssets && !isPoolAdmin && !isCash && !hasLoanTemplates) {
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

    if ((canCreateAssets && hasLoanTemplates && !isCash) || (poolAdmin && isCash)) {
      return (
        <Button style={{ width: '100%' }} disabled={!form.values.assetName}>
          Create
        </Button>
      )
    }

    return null
  }

  return (
    <Box display="flex" flexDirection="column" mt={3}>
      <Box flexGrow={1}>{renderCreateButton()}</Box>
      <Box mt={2} flexGrow={1}>
        <Button variant="inverted" onClick={() => setOpen(false)} style={{ width: '100%' }}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
