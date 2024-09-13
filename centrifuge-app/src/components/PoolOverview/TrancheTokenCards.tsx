import { Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { InvestButton, Token } from '../../pages/Pool/Overview'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { DataTable } from '../DataTable'
import { Tooltips } from '../Tooltips'

export const TrancheTokenCards = ({
  trancheTokens,
  poolId,
  createdAt,
  poolCurrency,
  pool,
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

const TrancheTokenCard = ({
  trancheToken,
  poolId,
  createdAt,
  numOfTrancheTokens,
  poolCurrencySymbol,
  trancheText,
}: {
  trancheToken: Token
  poolId: string
  createdAt: string | null
  numOfTrancheTokens: number
  poolCurrencySymbol: string
  trancheText: 'senior' | 'junior' | 'mezzanine'
}) => {
  const isMedium = useIsAboveBreakpoint('M')

  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = createdAt ? daysBetween(new Date(createdAt), new Date()) : 0
  const apyTooltipBody =
    poolId === '4139607887'
      ? 'Based on 3-month to 6-month T-Bills returns.'
      : poolId === '1655476167'
      ? 'Based on the return of the underlying funds'
      : `The 30d ${trancheText} yield is the effective annualized return of the pool's ${trancheText} token over the last 30 days.${
          daysSinceCreation < 30 && !isTinlakePool ? ' APY displayed after 30 days following token launch.' : ''
        }`

  const columns = useMemo(() => {
    return [
      {
        align: 'left',
        header: 'Token',
        cell: (row) => console.log(row),
      },
      {
        align: 'left',
        header: 'APY',
        cell: (row) => row,
      },
      {
        align: 'left',
        header: `TVL (${poolCurrencySymbol})`,
        cell: (row) => row,
      },
      {
        align: 'left',
        header: 'Token price',
        cell: (row) => row,
      },
      {
        align: 'left',
        header: 'Subordination',
        cell: (row) => row,
      },
      {
        align: 'left',
        header: '',
        cell: (row) => row,
      },
    ]
  }, [])

  const tableData = [trancheToken.name, trancheToken.apy, trancheToken.valueLocked, trancheToken.tokenPrice]

  const data = useMemo(() => {
    return trancheToken
  }, [])

  console.log(trancheToken)

  return (
    <Box marginY={2} backgroundColor="white" borderRadius="card" width="100%" overflow="auto">
      <DataTable columns={columns} data={[]} />
    </Box>
  )

  return (
    <Box p={2} marginY={2} backgroundColor="white" borderRadius="card" width="100%" overflow="auto">
      <Stack height="100%" justifyContent="space-between" gap={2}>
        <Text fontSize="12px" variant="body3">
          {trancheToken.name} ({trancheToken.symbol})
        </Text>
        <Shelf
          justifyContent="space-between"
          alignItems="flex-start"
          gap={[2, 2, 1]}
          flexDirection={['column', 'column', 'row']}
        >
          <Shelf gap={numOfTrancheTokens === 1 ? 5 : 2} alignItems="flex-end">
            <Stack gap={1} paddingRight={numOfTrancheTokens === 1 ? 3 : 0}>
              <Tooltips
                label={`${['1655476167', '4139607887'].includes(poolId) ? 'Target ' : ''}APY`}
                body={apyTooltipBody}
              />
              <Text fontSize={[14, 20, 30]} variant="body3" style={{ whiteSpace: 'nowrap' }}>
                {calculateApy()}
              </Text>
            </Stack>
            {isMedium && (
              <Stack gap={1}>
                <Tooltips variant="secondary" type="subordination" />
                <Text variant="body2">{formatPercentage(trancheToken.protection)}</Text>
              </Stack>
            )}
            <Stack gap={1}>
              <Box pb="3px">
                <Text textAlign="left" variant="label2" color="textSecondary">
                  Token price
                </Text>
              </Box>
              <Text variant="body2">{formatBalance(trancheToken.tokenPrice || 0, poolCurrencySymbol, 5, 5)}</Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="valueLocked" />
              <Text variant="body2">{formatBalance(trancheToken.valueLocked, poolCurrencySymbol)}</Text>
            </Stack>
          </Shelf>
          <InvestButton poolId={poolId} trancheId={trancheToken.id} />
        </Shelf>
      </Stack>
    </Box>
  )
}
