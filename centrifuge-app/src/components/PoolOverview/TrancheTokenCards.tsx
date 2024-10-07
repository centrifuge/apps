import { Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { InvestButton, Token } from '../../pages/Pool/Overview'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { usePool } from '../../utils/usePools'
import { DataTable } from '../DataTable'

export const TrancheTokenCards = ({ trancheTokens, poolId }: { trancheTokens: Token[]; poolId: string }) => {
  const pool = usePool(poolId)
  const theme = useTheme()
  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = pool?.createdAt ? daysBetween(new Date(pool.createdAt), new Date()) : 0

  const getTrancheText = (trancheToken: Token) => {
    if (trancheToken.seniority === 0) return 'junior'
    if (trancheToken.seniority === 1) return 'senior'
    return 'mezzanine'
  }

  const columnConfig = useMemo(() => {
    const calculateApy = (trancheToken: Token) => {
      if (isTinlakePool && getTrancheText(trancheToken) === 'senior') return formatPercentage(trancheToken.apy)
      if (daysSinceCreation < 30) return 'N/A'
      return trancheToken.yield30DaysAnnualized
        ? formatPercentage(new Perquintill(trancheToken.yield30DaysAnnualized))
        : '-'
    }

    return [
      {
        header: 'Token',
        align: 'left',
        formatter: (v: any) => v,
      },
      {
        header: 'APY',
        align: 'left',
        formatter: (v: any) => (v ? calculateApy(v) : '-'),
      },
      {
        header: `TVL (${pool?.currency.symbol})`,
        align: 'left',
        formatter: (v: any) => (v ? formatBalance(v) : '-'),
      },
      {
        header: 'Token price',
        align: 'left',
        formatter: (v: any) => (v ? formatBalance(v, pool?.currency.symbol, pool?.currency.decimals) : '-'),
      },
      ...(pool.tranches.length > 1
        ? [
            {
              header: 'Subordination',
              align: 'left',
              formatter: (_: any, row: any) => {
                if (row.value[1].seniority === 0) return '-'
                return formatPercentage(row.value[1].protection)
              },
            },
          ]
        : []),
      {
        header: '',
        align: 'left',
        formatter: (_: any, row: any) => {
          return <InvestButton poolId={poolId} trancheId={row.value[1].id} />
        },
      },
    ]
  }, [pool, poolId, isTinlakePool, daysSinceCreation])

  const columns = useMemo(() => {
    return columnConfig.map((col, index) => {
      return {
        align: col.align,
        header: col.header,
        cell: (row: any) => (
          <Text paddingY={2} fontWeight={col.header === 'APY' ? '600' : '400'} variant="heading2">
            {col.formatter(row.value[index], row)}
          </Text>
        ),
      }
    })
  }, [columnConfig])

  const dataTable = useMemo(() => {
    return trancheTokens.map((tranche) => ({
      value: [tranche.name, tranche, tranche.valueLocked, tranche.tokenPrice],
    }))
  }, [trancheTokens])

  return (
    <Shelf gap={3}>
      <Box marginY={2} backgroundColor="white" borderRadius="card" width="100%" overflow="auto">
        <DataTable
          headerStyles={{
            backgroundColor: 'white',
            border: 'transparent',
            borderBottom: `1px solid ${theme.colors.backgroundInverted}`,
          }}
          columns={columns}
          data={dataTable}
        />
      </Box>
    </Shelf>
  )
}
