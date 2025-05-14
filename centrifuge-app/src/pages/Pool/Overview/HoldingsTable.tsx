import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { formatBalance } from '../../../../src/utils/formatting'
import { DataTable, SortableTableHeader } from '../../../components/DataTable'
import { formatDate } from '../../../utils/date'

export const HoldingsTable = ({ metadata }: { metadata: PoolMetadata | undefined }) => {
  const assetsData = metadata?.holdingsCSV

  const format = (value: any, header: string) => {
    if (header.includes('date') && !header.includes('quantity')) {
      return formatDate(value)
    }
    if (header.includes('%')) {
      return `${value}%`
    }
    if (header.includes('market value')) {
      return formatBalance(value, 'USD', 2)
    }
    return value
  }

  const columns = assetsData?.headers.map((header: string) => {
    return {
      align: 'left',
      header: <SortableTableHeader label={header} />,
      cell: (l: any) => format(l[header], header.toLowerCase()),
      sortKey: header,
    }
  })

  if (!assetsData) {
    return null
  }

  return <DataTable data={(assetsData.data as any) || []} columns={columns || []} />
}
