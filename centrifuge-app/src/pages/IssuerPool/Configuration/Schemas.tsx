import { IconChevronRight, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { Schema } from '../../../types'
import { formatDate } from '../../../utils/date'
import { useMetadataMulti } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type Row = {
  name: string
  createdAt: Date | null
  id: string
}

export const Schemas: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()

  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const schemaIds = poolMetadata?.schemas?.map((s) => s.id) ?? []
  const schemaMetadata = useMetadataMulti<Schema>(schemaIds)

  const tableData = schemaIds.map((id, i) => {
    const meta = schemaMetadata[i].data
    const metaMeta = poolMetadata?.schemas?.[i]
    return {
      name: meta?.name ?? `Template ${i + 1}`,
      createdAt: metaMeta?.createdAt ? new Date(metaMeta?.createdAt) : null,
      id,
    }
  })

  return (
    <PageSection
      title="Asset templates"
      headerRight={
        <RouterLinkButton to={`/issuer/${poolId}/configuration/create-schema`} variant="secondary" small>
          {tableData.length ? 'Add another' : 'Add'}
        </RouterLinkButton>
      }
    >
      <DataTable
        data={tableData}
        onRowClicked={(row) => `/issuer/${poolId}/configuration/view-schema/${row.id}`}
        columns={[
          {
            align: 'left',
            header: 'Template name',
            cell: (row: Row) => (
              <Text variant="body2" fontWeight="600" color="textInteractive">
                {row.name}
              </Text>
            ),
            flex: '3',
          },
          {
            header: 'Created',
            cell: (row: Row) => <Text variant="body2">{row.createdAt && formatDate(row.createdAt)}</Text>,
            flex: '1',
          },
          {
            header: '',
            cell: () => <IconChevronRight size={24} color="textPrimary" />,
            flex: '0 0 72px',
          },
        ]}
      />
    </PageSection>
  )
}
