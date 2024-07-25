import { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { useContext, useEffect, useMemo } from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAllPoolAssetSnapshots, usePoolMetadata } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

const noop = (v: any) => v
const valuationLabels = {
  discountedCashFlow: 'Non-fungible asset - DCF',
  outstandingDebt: 'Non-fungible asset - at par',
  oracle: 'Fungible asset - external pricing',
}

function getColumnConfig(poolCreditType: string, symbol: string) {
  if (poolCreditType === 'privateCredit') {
    return [
      {
        header: 'ID',
        align: 'left',
        csvOnly: false,
        formatter: noop,
      },
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Principal outstanding',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Interest outstanding',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Principal repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Interest repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Additional repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      { header: 'Origination date', align: 'left', csvOnly: false, sortable: true, formatter: formatDate },
      { header: 'Maturity date', align: 'left', csvOnly: false, sortable: true, formatter: formatDate },
      { header: 'Valuation method', align: 'left', csvOnly: false, formatter: (v: any) => formatBalance(v, symbol, 2) },
      { header: 'Advance rate', align: 'left', csvOnly: false, formatter: (v: any) => formatBalance(v, symbol, 2) },
      { header: 'Collateral value', align: 'left', csvOnly: false, formatter: (v: any) => formatBalance(v, symbol, 2) },
      {
        header: 'Probability of default (PD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Loss given default (LGD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      { header: 'Discount rate', align: 'left', csvOnly: false, formatter: (v: any) => formatBalance(v, symbol, 2) },
    ]
  } else {
    return [
      {
        header: 'ID',
        align: 'left',
        csvOnly: false,
        formatter: noop,
      },
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Market value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Face value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Quantity',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Market price',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      { header: 'Maturity date', align: 'left', csvOnly: false, sortable: true, formatter: formatDate },
      {
        header: 'Unrealized profit',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
      {
        header: 'Realized profit',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => formatBalance(v, symbol, 2),
      },
    ]
  }
}

export function AssetList({ pool }: { pool: Pool }) {
  const { loanStatus, startDate, setCsvData } = useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const poolCreditType = useMemo(() => poolMetadata?.pool?.asset.class || 'privateCredit', [poolMetadata])
  const { symbol } = pool.currency

  const snapshots = useAllPoolAssetSnapshots(pool.id, startDate)
  const columnConfig = useMemo(() => getColumnConfig(poolCreditType, symbol), [poolCreditType, symbol])

  const columns = useMemo(
    () =>
      columnConfig
        .map((col, index) => ({
          align: col.align,
          header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
          sortKey: col.sortable ? `value[${index}]` : undefined,
          cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index])}</Text>,
          csvOnly: col.csvOnly,
        }))
        .filter((col) => !col.csvOnly),
    [columnConfig]
  )

  const data = useMemo(() => {
    if (!snapshots) return []

    return snapshots
      .filter(
        (snapshot) =>
          snapshot?.status !== 'Created' &&
          snapshot?.valuationMethod?.toLowerCase() !== 'cash' &&
          (loanStatus === 'all' || !loanStatus || snapshot?.status === loanStatus)
      )
      .map((snapshot) => {
        if (poolCreditType === 'privateCredit') {
          return {
            name: '',
            value: [
              snapshot.assetId,
              snapshot?.name,
              snapshot?.presentValue,
              snapshot?.outstandingPrincipal,
              snapshot?.outstandingInterest,
              snapshot?.totalRepaidPrincipal,
              snapshot?.totalRepaidInterest,
              snapshot?.totalRepaidUnscheduled,
              snapshot?.actualOriginationDate,
              snapshot?.actualMaturityDate,
              valuationLabels[snapshot?.valuationMethod] || snapshot?.valuationMethod,
              snapshot?.advanceRate,
              snapshot?.collateralValue,
              snapshot?.probabilityOfDefault,
              snapshot?.lossGivenDefault,
              snapshot?.discountRate,
            ],
            heading: false,
          }
        } else {
          return {
            name: '',
            value: [
              snapshot?.assetId,
              snapshot?.name,
              snapshot?.presentValue,
              snapshot.faceValue,
              snapshot?.outstandingQuantity,
              snapshot?.currentPrice,
              snapshot?.actualMaturityDate,
              snapshot?.unrealizedProfitAtMarketPrice,
              snapshot?.sumRealizedProfitFifo,
            ],
            heading: false,
          }
        }
      })
  }, [snapshots, poolCreditType, symbol, loanStatus])

  useEffect(() => {
    if (!snapshots?.length) {
      return
    }

    const formatted = data.map(({ value: values }) =>
      Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`]))
    )
    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-asset-list-${loanStatus.toLowerCase()}.csv`,
    })

    return () => {
      setCsvData(undefined)
      URL.revokeObjectURL(dataUrl)
    }
  }, [snapshots])

  if (!snapshots) {
    return <Spinner />
  }

  return data.length > 0 ? <DataTable data={data} columns={columns} hoverable /> : <UserFeedback reportType="Assets" />
}
