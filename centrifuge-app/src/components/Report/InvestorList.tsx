import { Pool, isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorList } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { copyable } from './utils'

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
      header: col.header,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index], row)}</Text>,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!investors) {
      return []
    }
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
            (evmChains as any)[investor.chainId]?.name || 'Centrifuge',
            investor.evmAddress || utils.formatAddress(investor.accountId),
            investor.balance.toFloat() + investor.claimableTrancheTokens.toFloat(),
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
        return isAddress(address) && isSameAddress(address, row.value[1])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investors, network, pool, address])

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data
      .map(({ value }) => value as string[])
      .map((values) => Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`])))

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
    <DataTable data={data} columns={columns} hoverable />
  ) : (
    <UserFeedback reportType="InvestorList" />
  )
}
