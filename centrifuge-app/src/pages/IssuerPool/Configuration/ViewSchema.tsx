import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '../../../components/PageHeader'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

export const IssuerPoolViewSchemaPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <ViewSchema />
    </PageWithSideBar>
  )
}

export const ViewSchema: React.FC = () => {
  const { pid: poolId, sid: schemaId } = useParams<{ pid: string; sid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { data: schemaData } = useMetadata(`ipfs://ipfs/${schemaId}`)

  return (
    <>
      <PageHeader
        title={schemaData?.name}
        subtitle={poolMetadata?.pool?.name}
        parent={{ to: `/issuer/${poolId}/configuration`, label: 'Configuration' }}
      />
      <Box p={3}>
        <Text variant="body2" as="pre" style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(schemaData, null, 2)}
        </Text>
      </Box>
    </>
  )
}
