import { CurrencyBalance, Pool, isSameAddress } from '@centrifuge/centrifuge-js'
import { NetworkIcon, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import BN from 'bn.js'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorList } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { convertCSV, copyable } from './utils'

const noop = (v: any) => v

export function InvestorList({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, network, address } = React.useContext(ReportContext)

  const utils = useCentrifugeUtils()
  const investors = useInvestorList(pool.id, activeTranche === 'all' ? undefined : activeTranche)

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
      align: 'right',
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row.token.currency.symbol, 2) : '-'),
    },
    {
      header: 'Pool %',
      align: 'right',
      sortable: true,
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatPercentage(v * 100, true, {}, 2) : '-'),
    },
    {
      header: 'Position currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Pending invest order',
      align: 'right',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
    {
      header: 'Pending invest order currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Pending redeem order',
      align: 'right',
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row.token.currency.symbol, 2) : '-'),
    },
    {
      header: 'Pending redeem order currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
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

    const totalPositions = new CurrencyBalance(
      investors.reduce((sum: BN, investor) => {
        return sum.add(investor.balance).add(investor.claimableTrancheTokens)
      }, new BN(0)),
      investors[0].balance.decimals || 18
    ).toFloat()

    return investors
      .filter((investor) => !investor.balance.isZero() || !investor.claimableTrancheTokens.isZero())
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
              <NetworkIcon size="iconSmall" network={investor.chainId || 'centrifuge'} />
              <Text style={{ marginLeft: 4 }}> {(evmChains as any)[investor.chainId]?.name || 'Centrifuge'}</Text>
            </Box>,
            investor.evmAddress || utils.formatAddress(investor.accountId),
            investor.balance.toFloat() + investor.claimableTrancheTokens.toFloat(),
            (investor.balance.toFloat() + investor.claimableTrancheTokens.toFloat()) / totalPositions,
            token.currency.symbol,
            investor.pendingInvestCurrency.toFloat(),
            pool.currency.symbol,
            investor.pendingRedeemTrancheTokens.toFloat(),
            token.currency.symbol,
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

  if (!investors) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} hoverable defaultSortKey="value[3]" />
    </Box>
  ) : (
    <UserFeedback reportType="InvestorList" />
  )
}
