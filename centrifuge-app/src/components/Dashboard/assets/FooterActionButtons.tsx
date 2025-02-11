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

  const createButton = useMemo(() => {
    const hasLoanTemplates = loanTemplates.length > 0
    const isPoolAdminFlag = !!poolAdmin

    if (type === 'upload-template') {
      return (
        <Box width="100%">
          <Button disabled={!form.values.assetName} style={{ width: '100%', marginBottom: 8 }}>
            Save
          </Button>
        </Box>
      )
    }

    if (isPoolAdminFlag && !isCash && !hasLoanTemplates) {
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

    if (!isPoolAdminFlag && !isCash && !hasLoanTemplates) {
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

    if ((hasLoanTemplates && !isCash) || (isPoolAdminFlag && isCash)) {
      return (
        <Button style={{ width: '100%' }} disabled={!form.values.assetName}>
          Create
        </Button>
      )
    }

    return (
      <Button style={{ width: '100%' }} disabled={true}>
        Create
      </Button>
    )
  }, [type, form.values.assetName, form.values.assetType, poolAdmin, loanTemplates, isCash, setType])

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
