import { Box, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { PageHeader } from '../../../components/PageHeader'
import { useMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

export function IssuerPoolViewLoanTemplatePage() {
  return <ViewLoanTemplate />
}

export function ViewLoanTemplate() {
  const { pid: poolId, sid: templateId } = useParams<{ pid: string; sid: string }>()
  if (!poolId || !templateId) throw new Error('Template not found')
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { data: templateData } = useMetadata(`ipfs://${templateId}`)

  return (
    <>
      <PageHeader
        title={templateData?.name}
        subtitle={poolMetadata?.pool?.name}
        parent={{ to: `/issuer/${poolId}/configuration`, label: 'Configuration' }}
      />
      <Box p={3}>
        <Text variant="body2" as="pre" style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(templateData, null, 2)}
        </Text>
      </Box>
    </>
  )
}
