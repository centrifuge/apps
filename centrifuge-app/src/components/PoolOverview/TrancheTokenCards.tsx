import { Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Button, Shelf, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { Token } from '../../pages/Pool/Overview'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { DataTable } from '../DataTable'

export const TrancheTokenCards = ({
  trancheTokens,
  poolId,
  createdAt,
  poolCurrency,
}: {
  trancheTokens: Token[]
  poolId: string
  createdAt: string | null
  poolCurrency: { symbol: string; decimals: number }
}) => {
  const theme = useTheme()
  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = createdAt ? daysBetween(new Date(createdAt), new Date()) : 0

  const getTrancheText = (trancheToken: Token) => {
    if (trancheToken.seniority === 0) return 'junior'
    if (trancheToken.seniority === 1) return 'senior'
    return 'mezzanine'
  }

  const calculateApy = (trancheToken: Token) => {
    if (isTinlakePool && getTrancheText(trancheToken) === 'senior') return formatPercentage(trancheToken.apy)
    if (daysSinceCreation < 30) return 'N/A'
    return trancheToken.yield30DaysAnnualized
      ? formatPercentage(new Perquintill(trancheToken.yield30DaysAnnualized))
      : '-'
  }

  const columnConfig = [
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
      header: `TVL (${poolCurrency.symbol})`,
      align: 'left',
      formatter: (v: any) => (v ? formatBalance(v) : '-'),
    },
    {
      header: 'Token price',
      align: 'left',
      formatter: (v: any) => (v ? formatBalance(v, poolCurrency.symbol, poolCurrency.decimals) : '-'),
    },
    {
      header: 'Subordination',
      align: 'left',
      formatter: (_: any, row: any) => '-',
    },
    {
      header: '',
      align: 'left',
      formatter: (_: any, row: any) => <Button>Invest</Button>,
    },
  ]

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

  console.log(columns)

  const dataTable = useMemo(() => {
    return trancheTokens.map((tranche) => ({
      value: [`${tranche.name} ${getTrancheText(tranche)}`, tranche, tranche.valueLocked, tranche.tokenPrice],
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
