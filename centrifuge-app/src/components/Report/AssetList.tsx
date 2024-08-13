import { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { useContext, useEffect, useMemo } from 'react'
import { useBasePath } from '../../../src/utils/useBasePath'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAllPoolAssetSnapshots, usePoolMetadata } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { RouterTextLink } from '../TextLink'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

const noop = (v: any) => v

const valuationLabels = {
  discountedCashFlow: 'Non-fungible asset - DCF',
  outstandingDebt: 'Non-fungible asset - at par',
  oracle: 'Fungible asset - external pricing',
}

function getColumnConfig(isPrivate: boolean, symbol: string) {
  if (isPrivate) {
    return [
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Principal outstanding',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Interest outstanding',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Principal repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Interest repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Additional repaid',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Origination date',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDate(v) : '-'),
      },
      {
        header: 'Maturity date',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDate(v) : 'Open-end'),
        sortKey: 'maturity-date',
      },
      {
        header: 'Valuation method',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v === 'OutstandingDebt' ? 'At par' : v),
      },
      {
        header: 'Advance rate',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatPercentage(v, true, {}, 2) : '-'),
      },
      {
        header: 'Collateral value',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Probability of default (PD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Loss given default (LGD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Discount rate',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
    ]
  } else {
    return [
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Market value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Face value',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Quantity',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, undefined, 2) : '-'),
      },
      {
        header: 'Market price',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Maturity date',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDate(v) : '-'),
      },
      {
        header: 'Unrealized profit',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
      {
        header: 'Realized profit',
        align: 'right',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatBalance(v, symbol, 2) : '-'),
      },
    ]
  }
}

export function AssetList({ pool }: { pool: Pool }) {
  const basePath = useBasePath()
  const { loanStatus, startDate, setCsvData } = useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { symbol } = pool.currency
  const poolCreditType = poolMetadata?.pool?.asset.class || 'privateCredit'
  const snapshots = useAllPoolAssetSnapshots(pool.id, startDate)
  const isPrivate = poolCreditType === 'Private credit' || poolCreditType === 'privateCredit'
  const columnConfig = getColumnConfig(isPrivate, symbol)

  const columns = useMemo(
    () =>
      columnConfig
        .map((col, index) => ({
          align: col.align,
          header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
          sortKey: col.sortable ? `value[${index}]` : undefined,
          cell: (row: TableDataRow) => {
            const assetId = row?.id?.split('-')[1]
            return col.header === 'Name' ? (
              <Text as="span" variant="body3">
                <RouterTextLink to={`${basePath}/${pool.id}/assets/${assetId}`}>
                  {col.formatter((row.value as any)[index])}
                </RouterTextLink>
              </Text>
            ) : (
              <Text variant="body3">{col.formatter((row.value as any)[index])}</Text>
            )
          },
          csvOnly: col.csvOnly,
        }))
        .filter((col) => !col.csvOnly),
    [columnConfig, basePath, pool.id]
  )
  const data = useMemo((): any[] => {
    if (!snapshots) return []

    return snapshots
      .filter((snapshot) => snapshot?.valuationMethod?.toLowerCase() !== 'cash')
      .filter((snapshot) => {
        const isMaturityDatePassed = snapshot?.actualMaturityDate
          ? new Date() > new Date(snapshot.actualMaturityDate)
          : false
        const isDebtZero = snapshot?.outstandingDebt?.isZero()

        if (loanStatus === 'ongoing') {
          return snapshot.status === 'ACTIVE' && !isMaturityDatePassed && !isDebtZero
        } else if (loanStatus === 'repaid') {
          return isMaturityDatePassed && isDebtZero
        } else if (loanStatus === 'overdue') {
          return isMaturityDatePassed && !isDebtZero
        } else return true
      })
      .sort((a, b) => {
        // Sort by actualMaturityDate in descending order
        const dateA = new Date(a.actualMaturityDate || 0).getTime()
        const dateB = new Date(b.actualMaturityDate || 0).getTime()
        return dateB - dateA
      })
      .map((snapshot) => {
        const valuationMethod = snapshot?.valuationMethod as keyof typeof valuationLabels
        if (isPrivate) {
          return {
            name: '',
            value: [
              snapshot?.name,
              snapshot?.presentValue,
              snapshot?.outstandingPrincipal,
              snapshot?.outstandingInterest,
              snapshot?.totalRepaidPrincipal,
              snapshot?.totalRepaidInterest,
              snapshot?.totalRepaidUnscheduled,
              snapshot?.actualOriginationDate,
              snapshot?.actualMaturityDate,
              valuationMethod || snapshot?.valuationMethod,
              snapshot?.advanceRate,
              snapshot?.collateralValue,
              snapshot?.probabilityOfDefault,
              snapshot?.lossGivenDefault,
              snapshot?.discountRate,
            ],
            heading: false,
            id: snapshot?.assetId,
          }
        } else {
          return {
            name: '',
            value: [
              snapshot?.name,
              snapshot?.presentValue,
              snapshot?.faceValue,
              snapshot?.outstandingQuantity,
              snapshot?.currentPrice,
              snapshot?.actualMaturityDate,
              snapshot?.unrealizedProfitAtMarketPrice,
              snapshot?.sumRealizedProfitFifo,
            ],
            heading: false,
            id: snapshot?.assetId,
          }
        }
      })
  }, [snapshots, isPrivate, loanStatus])

  useEffect(() => {
    if (!data?.length) {
      return
    }

    const formatted = data.map(({ value: values }) =>
      Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`]))
    )
    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl: dataUrl ?? 'default-data-url',
      fileName: `${pool.id}-asset-list-${loanStatus.toLowerCase()}.csv`,
    })

    return () => {
      setCsvData(undefined)
      if (dataUrl) {
        URL.revokeObjectURL(dataUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!snapshots) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable defaultSortKey="maturity-date" defaultSortOrder="desc" />
  ) : (
    <UserFeedback reportType="Assets" />
  )
}
