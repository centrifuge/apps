import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { DataTable, SortableTableHeader } from '../../../components/DataTable'

export const HoldingsTable = ({ metadata }: { metadata: PoolMetadata | undefined }) => {
  const assetsData = metadata?.holdingsCSV

  const columns = assetsData?.headers.map((header: string) => {
    return {
      align: 'left',
      header: <SortableTableHeader label={header} />,
      cell: (l: any) => l[header],
      sortKey: header,
    }
  })

  if (!assetsData) {
    return null
  }

  return <DataTable data={(assetsData.data as any) || []} columns={columns || []} />
}
