import { Pool } from '@centrifuge/centrifuge-js'
import { Box, Text } from '@centrifuge/fabric'
import { AssetListReport } from '@centrifuge/sdk/dist/types/reports'
import { useContext, useEffect, useMemo } from 'react'
import { useBasePath } from '../../../src/utils/useBasePath'
import { formatDate } from '../../utils/date'
import { formatDecimal, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePoolMetadata } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { RouterTextLink } from '../TextLink'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'

const noop = (v: any) => v

const valuationLabels = {
  discountedCashFlow: 'Non-fungible asset - DCF',
  outstandingDebt: 'Non-fungible asset - at par',
  oracle: 'Fungible asset - external pricing',
}

type AssetSnapshot = AssetListReport & {
  transactionType: 'ACTIVE' | string
  name: string
}

function getColumnConfig(isPrivate: boolean, symbol: string, decimals: number) {
  if (isPrivate) {
    return [
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Value',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Principal outstanding',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Interest outstanding',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Principal repaid',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Interest repaid',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Additional repaid',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
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
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Probability of default (PD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Loss given default (LGD)',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Discount rate',
        align: 'left',
        csvOnly: false,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
    ]
  } else {
    return [
      { header: 'Name', align: 'left', csvOnly: false, formatter: noop },
      {
        header: 'Market value',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Face value',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Quantity',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, '') : '-'),
      },
      {
        header: 'Market price',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
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
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
      {
        header: 'Realized profit',
        align: 'left',
        csvOnly: false,
        sortable: true,
        formatter: (v: any) => (v ? formatDecimal(v, 2, symbol) : '-'),
      },
    ]
  }
}

export function AssetList({ pool }: { pool: Pool }) {
  const basePath = useBasePath()
  const { loanStatus, startDate, setCsvData, endDate } = useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { symbol, decimals } = pool.currency
  const poolCreditType = poolMetadata?.pool?.asset.class || 'privateCredit'
  const isPrivate = poolCreditType === 'Private credit' || poolCreditType === 'privateCredit'
  const columnConfig = getColumnConfig(isPrivate, symbol, decimals)

  const { data: snapshots = [], isLoading } = useReport(
    'assetList',
    pool,
    new Date(startDate),
    new Date(endDate),
    undefined,
    {
      ...(loanStatus && { status: loanStatus }),
    }
  )

  console.log(snapshots, isPrivate)

  const columns = useMemo(
    () =>
      columnConfig
        .map((col, index) => ({
          align: col.align,
          header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
          sortKey: col.sortable ? `value[${index}]` : undefined,
          width: '177px',
          cell: (row: TableDataRow & { id: string }) => {
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

    return (snapshots as AssetSnapshot[])
      .filter((snapshot) => snapshot?.valuationMethod?.toLowerCase() !== 'cash')
      .filter((snapshot) => {
        const isMaturityDatePassed = snapshot?.maturityDate ? new Date() > new Date(snapshot.maturityDate) : false
        const isDebtZero = 'outstandingQuantity' in snapshot ? snapshot.outstandingQuantity?.isZero() : false

        if (loanStatus === 'ongoing') {
          return snapshot.transactionType === 'ACTIVE' && !isMaturityDatePassed && !isDebtZero
        } else if (loanStatus === 'repaid') {
          return isMaturityDatePassed && isDebtZero
        } else if (loanStatus === 'overdue') {
          return isMaturityDatePassed && !isDebtZero
        } else return true
      })
      .sort((a, b) => {
        // Sort by actualMaturityDate in descending order
        const dateA = new Date(a.maturityDate || 0).getTime()
        const dateB = new Date(b.maturityDate || 0).getTime()
        return dateB - dateA
      })
      .map((snapshot) => {
        const valuationMethod =
          'valuationMethod' in snapshot ? (snapshot.valuationMethod as keyof typeof valuationLabels) : ''
        if (isPrivate) {
          return {
            name: '',
            value: [
              snapshot?.name,
              snapshot?.presentValue,
              snapshot?.outstandingPrincipal,
              snapshot?.outstandingInterest,
              snapshot?.repaidPrincipal,
              snapshot?.repaidInterest,
              snapshot?.repaidUnscheduled,
              snapshot?.originationDate,
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
              snapshot?.maturityDate,
              snapshot?.unrealizedProfit,
              snapshot?.realizedProfit,
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

  if (isLoading) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <Box paddingX={2}>
      <DataTable
        data={data}
        columns={columns}
        hoverable
        defaultSortKey="maturity-date"
        defaultSortOrder="desc"
        scrollable
      />
    </Box>
  ) : (
    <UserFeedback reportType="Assets" />
  )
}
