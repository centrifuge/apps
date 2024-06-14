import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Text, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import {
  useAggregatedPoolFeeStatesByGroup,
  useAggregatedPoolStatesByGroup,
  usePoolMetadata,
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

export function ProfitAndLoss({ pool }: { pool: Pool }) {
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

  const poolFeeStates = useAggregatedPoolFeeStatesByGroup(
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
  }, [poolStates, groupBy, pool])

  const profitAndLossPublicRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Income',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      {
        name: 'Realized profit / loss',
        nameTooltip: 'Based on first-in, first-out calculation of the transactions of each individual asset',
        value: poolStates?.map(({ poolState }) => poolState.sumRealizedProfitFifoByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Unrealized profit / loss',
        nameTooltip: 'Based on selling the assets in the pool at the current market price',
        value: poolStates?.map(({ poolState }) => poolState.sumUnrealizedProfitByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Interest payments',
        value: poolStates?.map(({ poolState }) => poolState.sumInterestRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Other payments',
        value: poolStates?.map(({ poolState }) => poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Total income ',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumRealizedProfitFifoByPeriod
              .toDecimal()
              .add(poolState.sumUnrealizedProfitByPeriod.toDecimal())
              .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates])

  const profitAndLossPrivateRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Income',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      {
        name: 'Interest payments',
        value: poolStates?.map(({ poolState }) => poolState?.sumInterestRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Interest accrued',
        value: poolStates?.map(({ poolState }) => poolState.sumInterestAccruedByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Other payments',
        value: poolStates?.map(({ poolState }) => poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Asset write-offs',
        value: poolStates?.map(({ poolState }) => poolState.sumDebtWrittenOffByPeriod.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Profit / loss from assets ',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumInterestRepaidAmountByPeriod
              .toDecimal()
              .add(poolState.sumInterestAccruedByPeriod.toDecimal())
              .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
              .sub(poolState.sumDebtWrittenOffByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates])

  const profitAndLossRecords =
    poolMetadata?.pool?.asset.class === 'Private credit' ? profitAndLossPrivateRecords : profitAndLossPublicRecords

  const feesRecords = React.useMemo(() => {
    return [
      {
        name: 'Expenses',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      ...(poolFeeStates
        ?.map((poolFeeStateByPeriod) => {
          return Object.values(poolFeeStateByPeriod)
            ?.map((feeState) => {
              // some fee data may be incomplete since fees may have been added sometime after pool creation
              // this fill the nonexistant fee data with zero values
              let missingStates: {
                timestamp: string
                sumAccruedAmountByPeriod: CurrencyBalance
                sumChargedAmountByPeriod: CurrencyBalance
              }[] = []
              if (feeState.length !== poolStates?.length) {
                const missingTimestamps = poolStates
                  ?.map((state) => state.timestamp)
                  .filter((timestamp) => {
                    return !feeState.find((state) => state.timestamp === timestamp)
                  })
                missingStates =
                  missingTimestamps?.map((timestamp) => {
                    return {
                      timestamp,
                      sumAccruedAmountByPeriod: CurrencyBalance.fromFloat(0, pool.currency.decimals),
                      sumChargedAmountByPeriod: CurrencyBalance.fromFloat(0, pool.currency.decimals),
                    }
                  }) || []
              }
              return {
                name: feeState[0].poolFee.name,
                value: [...missingStates, ...feeState].map((state) =>
                  state.sumAccruedAmountByPeriod.toDecimal().add(state.sumChargedAmountByPeriod.toDecimal())
                ),
                formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, pool.currency.displayName, 2)}`,
              }
            })
            .flat()
        })
        .flat() || []),
      {
        name: 'Total expenses ',
        value:
          poolStates?.map(({ poolState }) =>
            poolState.sumPoolFeesChargedAmountByPeriod
              .toDecimal()
              .sub(poolState.sumPoolFeesAccruedAmountByPeriod.toDecimal())
          ) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates, pool, poolFeeStates])

  const totalProfitRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Total profit / loss',
        value:
          poolStates?.map(({ poolState }) =>
            (poolMetadata?.pool?.asset.class === 'Private credit'
              ? poolState.sumInterestRepaidAmountByPeriod
                  .toDecimal()
                  .add(poolState.sumInterestAccruedByPeriod.toDecimal())
                  .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
                  .sub(poolState.sumDebtWrittenOffByPeriod.toDecimal())
              : poolState.sumRealizedProfitFifoByPeriod
                  .toDecimal()
                  .add(poolState.sumUnrealizedProfitByPeriod.toDecimal())
                  .add(poolState.sumInterestRepaidAmountByPeriod.toDecimal())
                  .add(poolState.sumUnscheduledRepaidAmountByPeriod.toDecimal())
            )
              .sub(poolState.sumPoolFeesChargedAmountByPeriod.toDecimal())
              .sub(poolState.sumPoolFeesAccruedAmountByPeriod.toDecimal())
          ) || [],
        heading: true,
        formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
      },
    ]
  }, [poolStates, pool])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...profitAndLossRecords, ...feesRecords, ...totalProfitRecords].map(({ name, value }) => [
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
      fileName: `${pool.id}-profit-and-loss-${formatDate(startDate, {
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
  }, [profitAndLossRecords, feesRecords, totalProfitRecords])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={profitAndLossRecords} columns={columns} hoverable />
      <DataTable data={feesRecords} columns={columns} hoverable />
      <DataTable data={totalProfitRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Profit and loss" />
  )
}
