import { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useHolders } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { evmChains } from '../Root'
import { Spinner } from '../Spinner'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'

const headers = ['Account', 'Network', 'Position', 'Pending invest order', 'Pending redeem order']

function truncate(string: string) {
  const first = string.slice(0, 5)
  const last = string.slice(-5)

  return `${first}...${last}`
}

const noop = (v: any) => v
const cellFormatters = [truncate, noop, noop, noop, noop]

const columns = headers.map((col, index) => ({
  align: 'left',
  header: col,
  cell: (row: TableDataRow) => <Text variant="body2">{cellFormatters[index]((row.value as any)[index])}</Text>,
}))

export function Holders({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData } = React.useContext(ReportContext)

  const holders = useHolders(pool.id, activeTranche === 'all' ? undefined : activeTranche)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!holders) {
      return []
    }

    return holders.map((holder) => ({
      name: '',
      value: [
        holder.evmAddress || holder.accountId,
        (evmChains as any)[holder.chainId]?.name || 'Centrifuge',
        formatBalance(
          holder.sumInvestUncollectedAmount
            .toDecimal()
            .add(holder.sumInvestCollectedAmount.toDecimal())
            .sub(holder.sumRedeemOrderedAmount.toDecimal())
            .sub(holder.sumRedeemUncollectedAmount.toDecimal())
            .sub(holder.sumRedeemCollectedAmount.toDecimal()),
          pool.currency
        ),
        formatBalance(holder.sumInvestOrderedAmount.toDecimal(), pool.currency),
        formatBalance(holder.sumRedeemOrderedAmount.toDecimal(), pool.currency),
      ],
      heading: false,
    }))
  }, [holders])

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data
      .map(({ value }) => value as string[])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
  }, [data])

  React.useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-holders.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id])

  if (!holders) {
    return <Spinner />
  }

  return data.length > 0 ? <DataTable data={data} columns={columns} hoverable /> : <UserFeedback reportType="Holders" />
}
