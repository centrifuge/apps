import { Pool, isSameAddress } from '@centrifuge/centrifuge-js'
import { NetworkIcon, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { formatBalance, formatPercentage } from '../../../src/utils/formatting-sdk'
import { evmChains } from '../../config'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'
import { convertCSV, copyable } from './utils'

const noop = (v: any) => v

export function InvestorList({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, network, address, startDate, endDate } = React.useContext(ReportContext)

  const utils = useCentrifugeUtils()

  const { data: investors = [], isLoading } = useReport(
    'investorList',
    pool,
    new Date(startDate),
    new Date(endDate),
    undefined,
    {
      ...(network !== 'all' && network && { network }),
      ...(address && { address }),
      ...(activeTranche !== 'all' && { tokenId: activeTranche }),
    }
  )

  const columnConfig = [
    {
      header: 'Network',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Account',
      align: 'left',
      csvOnly: false,
      formatter: copyable,
    },
    {
      header: 'Position',
      align: 'left',
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, 2, row.token.currency.symbol) : '-'),
    },
    {
      header: 'Pool %',
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (v ? formatPercentage(v) : '-'),
    },

    {
      header: 'Pending invest order',
      align: 'left',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, 2, pool.currency.symbol) : '-'),
    },
    {
      header: 'Pending redeem order',
      align: 'left',
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, 2, row.token.currency.symbol) : '-'),
    },
  ]

  const columns = columnConfig
    .map((col, index) => ({
      align: col.align,
      header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index], row)}</Text>,
      sortKey: col.sortable ? `value[${index}]` : undefined,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!investors) {
      return []
    }

    return investors
      .filter((investor) => !investor.position.isZero())
      .filter((tx) => {
        if (!network || network === 'all') return true
        return network === (tx.chainId || 'centrifuge')
      })
      .map((investor) => {
        const token = pool.tranches.find((t) => t.id === investor.trancheId)!
        return {
          name: '',
          value: [
            <Box display={'flex'}>
              <NetworkIcon
                size="iconSmall"
                network={(investor.chainId !== 'all' && investor.chainId) || 'centrifuge'}
              />
              <Text style={{ marginLeft: 4 }}> {(evmChains as any)[investor.chainId]?.name || 'Centrifuge'}</Text>
            </Box>,
            investor.evmAddress || utils.formatAddress(investor.accountId),
            investor.position.toFloat(),
            investor.poolPercentage,
            investor.pendingInvest.toFloat(),
            investor.pendingRedeem.toFloat(),
          ],
          token,
          heading: false,
        }
      })
      .filter((row) => {
        if (!address) return true
        const addressValue = row.value[1] as string
        return isAddress(address) && isSameAddress(address, addressValue)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investors, network, pool, address])

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) => convertCSV(values, columnConfig))

    return getCSVDownloadUrl(formatted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  React.useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-investors.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id])

  if (isLoading) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} hoverable defaultSortKey="value[3]" scrollable />
    </Box>
  ) : (
    <UserFeedback reportType="InvestorList" />
  )
}
