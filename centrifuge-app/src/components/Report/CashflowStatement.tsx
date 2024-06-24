import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Text, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import {
  useAggregatedPoolStatesByGroup,
  usePoolFeeStatesByGroup,
  usePoolMetadata,
  usePoolStatesByGroup,
} from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  nameTooltip?: string
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

  const poolFeeStates = usePoolFeeStatesByGroup(
    pool.id,
    adjustedStartDate,
    adjustedEndDate,
    groupBy === 'daily' ? 'day' : groupBy
  )

  const columns = React.useMemo(() => {
    if (!poolStates || !poolStates.length) {
      return []
    }

    const getColumnHeader = (timestamp: string) => {
      if (groupBy === 'day' || groupBy === 'daily') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      } else if (groupBy === 'month') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      } else if (groupBy === 'quarter') {
        const date = new Date(timestamp)
        return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
      } else if (groupBy === 'year') {
        return new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
        })
      }
      return ''
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: Row) =>
          row.nameTooltip ? (
            <Tooltip body={row.nameTooltip}>
              <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
            </Tooltip>
          ) : (
            <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
          ),
        width: '240px',
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'right',
          timestamp: state.timestamp,
          header: getColumnHeader(state.timestamp),
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
  }, [poolStates, groupBy, pool, poolFeeStates])

  const grossCashflowRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Principal payments',
        value:
          poolStates?.map(({ poolState }) =>
            poolState?.sumPrincipalRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumRealizedProfitFifoByPeriod.toDecimal())
          ) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      ...(poolMetadata?.pool?.asset.class === 'Public credit'
        ? [
            {
              name: 'Realized profit / loss',
              nameTooltip: 'Based on first-in, first-out calculation of the transactions of each individual asset',
              value: poolStates?.map(({ poolState }) => poolState.sumRealizedProfitFifoByPeriod.toDecimal()) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
            },
          ]
        : []),
      {
        name: 'Interest payments',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumInterestRepaidAmountByPeriod
              .toDecimal()
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: poolMetadata?.pool?.asset.class === 'Private credit' ? 'Asset financings' : 'Asset purchases',
        value: poolStates?.map(({ poolState }) => poolState.sumBorrowedAmountByPeriod.toDecimal().neg()) || [],
        heading: false,
        formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Net cash flow from assets',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumPrincipalRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates])

  const netCashflowRecords: Row[] = React.useMemo(() => {
    return [
      ...(poolFeeStates
        ?.map((poolFeeStateByPeriod) => {
          return Object.values(poolFeeStateByPeriod)
            ?.map((feeState) => {
              // some fee data may be incomplete since fees may have been added sometime after pool creation
              // this fill the nonexistant fee data with zero values
              let missingStates: {
                timestamp: string
                sumPaidAmountByPeriod: CurrencyBalance
              }[] = []
              if (feeState.length !== poolStates?.length) {
                const missingTimestamps = poolStates
                  ?.map((state) => state.timestamp)
                  .filter((timestamp) => !feeState.find((state) => state.timestamp === timestamp))
                missingStates =
                  missingTimestamps?.map((timestamp) => {
                    return {
                      timestamp,
                      sumPaidAmountByPeriod: CurrencyBalance.fromFloat(0, pool.currency.decimals),
                    }
                  }) || []
              }
              return {
                name: feeState[0].poolFee.name,
                value: [...missingStates, ...feeState].map((state) => state.sumPaidAmountByPeriod.toDecimal().neg()),
                formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
              }
            })
            .flat()
        })
        .flat() || []),
      {
        name: 'Net cash flow after fees',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumPrincipalRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
              .sub(poolState.sumPoolFeesPaidAmountByPeriod.toDecimal())
          ) || [],
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        heading: false,
        bold: true,
      },
    ]
  }, [poolStates, pool, poolFeeStates])

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
        value: poolStates?.map(({ poolState }) => poolState.sumRedeemedAmountByPeriod.toDecimal().neg()) || [],
        heading: false,
        formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Cash flow from investment activities',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumInvestedAmountByPeriod.toDecimal().sub(poolState.sumRedeemedAmountByPeriod.toDecimal())
          ) || [],
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        heading: false,
        bold: true,
      },
    ]
  }, [poolStates, pool])

  const endCashflowRecords = React.useMemo(() => {
    return [
      {
        name: 'Total cash flow',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumPrincipalRepaidAmountByPeriod
              .toDecimal()
              .sub(poolState.sumBorrowedAmountByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
              .sub(poolState.sumPoolFeesPaidAmountByPeriod.toDecimal())
              .add(poolState.sumInvestedAmountByPeriod.toDecimal())
              .sub(poolState.sumRedeemedAmountByPeriod.toDecimal())
          ) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'End cash balance',
        value:
          poolStatesNotAggregated?.map(({ poolState }) =>
            poolState.totalReserve.toDecimal().add(poolState.offchainCashValue.toDecimal())
          ) || [],
        bold: true,
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
      fileName: `${pool.id}-cash-flow-statement-${formatDate(startDate, {
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
