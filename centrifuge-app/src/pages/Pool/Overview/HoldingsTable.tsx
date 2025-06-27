import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import { formatBalance } from '../../../../src/utils/formatting'
import { DataTable, SortableTableHeader } from '../../../components/DataTable'
import { formatDate, isValidDate } from '../../../utils/date'

export const HoldingsTable = ({ metadata }: { metadata: PoolMetadata | undefined }) => {
  const assetsData = metadata?.holdings

  const format = (value: any, header: string) => {
    if (header.includes('date') && !header.includes('quantity')) {
      return isValidDate(value) ? formatDate(value) : '-'
    }
    if (header.includes('%')) {
      return `${value}%`
    }
    if (header.includes('marketvalue')) {
      return formatBalance(value, 'USD', 2)
    }
    if (header.includes('quantity')) {
      return formatBalance(value, '', 2)
    }

    return !value ? '-' : value
  }

  const columns = assetsData?.headers.map((header: string, index: number) => {
    const transformedHeader = header.toLowerCase().split(' ').join('')
    return {
      align: 'left',
      header: <SortableTableHeader label={header} />,
      cell: (l: any) => (
        <Text variant={index === 0 ? 'heading4' : 'body2'}>{format(l[transformedHeader], transformedHeader)}</Text>
      ),
      sortKey: transformedHeader,
    }
  })

  const data = assetsData?.data.map((row: any) => {
    return {
      ...Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          const k = key.toLowerCase().split(' ').join('')
          return [k, k.includes('maturitydate') ? new Date(value as string) : value]
        })
      ),
    }
  })

  if (!assetsData || assetsData.data.length === 0) {
    return null
  }

  return (
    <Stack gap={2} mt={2}>
      <Text variant="heading2">Holdings</Text>
      <DataTable data={data || []} columns={columns || []} defaultSortKey="maturitydate" defaultSortOrder="asc" />
    </Stack>
  )
}
