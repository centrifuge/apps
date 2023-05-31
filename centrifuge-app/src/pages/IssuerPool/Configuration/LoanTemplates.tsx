import { IconChevronRight, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { LoanTemplate } from '../../../types'
import { formatDate } from '../../../utils/date'
import { useMetadataMulti } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type Row = {
  name: string
  createdAt: Date | null
  id: string
}

export function LoanTemplates() {
  const { pid: poolId } = useParams<{ pid: string }>()

  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateMetadata = useMetadataMulti<LoanTemplate>(templateIds)

  const tableData = templateIds.map((id, i) => {
    const meta = templateMetadata[i].data
    const metaMeta = poolMetadata?.loanTemplates?.[i]
    return {
      name: meta?.name ?? `Version ${i + 1}`,
      createdAt: metaMeta?.createdAt ? new Date(metaMeta?.createdAt) : null,
      id,
    }
  })

  return (
    <PageSection
      title="Asset templates"
      headerRight={
        <RouterLinkButton to={`/issuer/${poolId}/configuration/create-asset-template`} variant="secondary" small>
          {tableData.length ? 'Update template' : 'Create'}
        </RouterLinkButton>
      }
    >
      <DataTable
        data={tableData}
        onRowClicked={(row) => `/issuer/${poolId}/configuration/view-asset-template/${row.id}`}
        columns={[
          {
            align: 'left',
            header: 'Asset template',
            cell: (row: Row) => (
              <Text fontWeight="600" color="textInteractive">
                {row.name}
              </Text>
            ),
            flex: '3',
          },
          {
            header: 'Created',
            cell: (row: Row) => row.createdAt && formatDate(row.createdAt),
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
