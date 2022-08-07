import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { getCurrencySymbol } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'

export type ReportingMoment = {
  blockNumber: number
  timestamp: Date
}

type Props = {
  moments: ReportingMoment[]
}

type TableDataRow = {
  name: string | React.ReactElement
  value: string[] | React.ReactElement
}

export const Report: React.FC<Props> = ({ moments }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const columns: Column[] = [
    {
      align: 'left',
      header: '',
      cell: (row: TableDataRow) => <Text variant="body2">{row.name}</Text>,
      flex: '1',
    },
  ].concat(
    moments.map((moment, index) => {
      return {
        align: 'right',
        header: `${moment.timestamp.toLocaleDateString('en-US', {
          month: 'short',
        })} ${moment.timestamp.toLocaleDateString('en-US', { day: 'numeric' })}`,
        cell: (row: TableDataRow) => <Text variant="body2">{row.value[index]}</Text>,
        flex: '1',
      }
    })
  )

  const overviewRecords: TableDataRow[] = [
    {
      name: `Pool value`,
      value: moments.map(() => '0.00'),
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value: moments.map(() => '0.00'),
        }
      }) || [],
    [
      {
        name: `Asset value`,
        value: moments.map(() => '0.00'),
      },
      {
        name: `Reserve`,
        value: moments.map(() => '0.00'),
      },
    ]
  )

  const priceRecords: TableDataRow[] = [
    {
      name: `Token price`,
      value: moments.map(() => ''),
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value: moments.map((moment) => '1.000'),
        }
      }) || []
  )

  return (
    <Stack gap="2">
      <Stack gap="3">
        <DataTableGroup>
          <DataTable data={overviewRecords} columns={columns} hoverable />
          <DataTable data={priceRecords} columns={columns} hoverable />
        </DataTableGroup>
      </Stack>
      <Text variant="body3" color="textSecondary">
        All amounts are in {pool && getCurrencySymbol(pool.currency)}.
      </Text>
    </Stack>
  )
}
