import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAggregatedPoolStatesByGroup, usePoolMetadata, usePoolStatesByGroup } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  bold?: boolean
}

export function CashflowStatement({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const [adjustedStartDate, adjustedEndDate] = React.useMemo(() => {
    const today = new Date()
    today.setDate(today.getDate())
    today.setHours(0, 0, 0, 0)
    if (groupBy === 'day') {
      const from = new Date(startDate ?? today)
      from.setHours(0, 0, 0, 0)
      const to = new Date(startDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [from, to]
    } else if (groupBy === 'daily') {
      const from = new Date(startDate ?? today)
      from.setHours(0, 0, 0, 0)
      const to = new Date(endDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [from, to]
    } else if (groupBy === 'quarter' || groupBy === 'year') {
      const from = pool.createdAt ? new Date(pool.createdAt) : today
      return [from, today]
    } else {
      const to = new Date(endDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [new Date(startDate), to]
    }
  }, [groupBy, startDate, endDate])

  const poolStates = useAggregatedPoolStatesByGroup(
    pool.id,
    adjustedStartDate,
    adjustedEndDate,
    groupBy === 'daily' ? 'day' : groupBy
  )

  const poolStatesNotAggregated = usePoolStatesByGroup(
    pool.id,
    adjustedStartDate,
    adjustedEndDate,
    groupBy === 'daily' ? 'day' : groupBy
  )

  const columns = React.useMemo(() => {
    if (!poolStates || !poolStates.length) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: Row) => (
          <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
        ),
        width: '200px',
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'right',
          timestamp: state.timestamp,
          header: new Date(state.timestamp!).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          cell: (row: Row) => (
            <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>
              {row.formatter ? row.formatter((row.value as any)[index]) : (row.value as any)[index]}
            </Text>
          ),
          width: '170px',
        }))
      )
      .concat({
        align: 'left',
        header: '',
        cell: () => <span />,
        width: '1fr',
      })
  }, [poolStates, groupBy, pool])

  const grossCashflowRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: poolMetadata?.pool?.asset.class === 'privateCredit' ? 'Repayments' : 'Sales',
        value: poolStates?.map(({ poolState }) => poolState?.sumRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: poolMetadata?.pool?.asset.class === 'privateCredit' ? 'Financings' : 'Purchases',
        value: poolStates?.map(({ poolState }) => poolState.sumBorrowedAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Interest payments',
        value: poolStates?.map(({ poolState }) => poolState.sumInterestRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '= Gross cash flow',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates])

  const netCashflowRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Fees',
        value: poolStates?.map(({ poolState }) => poolState.sumPoolFeesChargedAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: '= Net cash flow',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .sub(poolState.sumPoolFeesChargedAmountByPeriod.toDecimal())
          ) || [],
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        heading: false,
        bold: true,
      },
    ]
  }, [poolStates, pool])

  const investRedeemRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Pool investments',
        value: poolStates?.map(({ poolState }) => poolState.sumInvestedAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Pool redemptions',
        value: poolStates?.map(({ poolState }) => poolState.sumRedeemedAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: '= Total cash flow',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .sub(poolState.sumPoolFeesChargedAmountByPeriod.toDecimal())
              .add(poolState.sumInvestedAmountByPeriod.toDecimal())
              .sub(poolState.sumRedeemedAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates, pool])

  const endCashflowRecords = React.useMemo(() => {
    return [
      {
        name: 'End cash balance',
        value:
          poolStatesNotAggregated?.map(({ poolState }) =>
            poolState.totalReserve.toDecimal().add(poolState.offchainCashValue.toDecimal())
          ) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStatesNotAggregated, pool])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...grossCashflowRecords, ...netCashflowRecords, ...investRedeemRecords].map(({ name, value }) => [
      name.trim(),
      ...(value as string[]),
    ])
    let formatted = f.map((values) =>
      Object.fromEntries(headers.map((_, index) => [`"${headers[index]}"`, `"${values[index]}"`]))
    )

    if (!formatted.length) {
      return
    }

    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-cashflow-statement-${formatDate(startDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}-${formatDate(endDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}.csv`,
    })

    return () => {
      setCsvData(undefined)
      URL.revokeObjectURL(dataUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grossCashflowRecords, netCashflowRecords])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={grossCashflowRecords} columns={columns} hoverable />
      <DataTable data={netCashflowRecords} columns={columns} hoverable />
      <DataTable data={investRedeemRecords} columns={columns} hoverable />
      <DataTable data={endCashflowRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Cash flow statement" />
  )
}
