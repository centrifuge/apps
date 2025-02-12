import { Box, Checkbox, Grid, IconArrowDown, IconArrowUp, Select, Text } from '@centrifuge/fabric'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'styled-components'
import { PoolCard } from '../../../src/components/Dashboard/PoolCard'
import { useTotalNAV } from '../../../src/components/Dashboard/assets/utils'
import { PageSummary } from '../../../src/components/PageSummary'
import { Spinner } from '../../../src/components/Spinner'
import { Dec } from '../../../src/utils/Decimal'
import { useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import { formatBalance, formatPercentage } from '../../../src/utils/formatting'
import { useLiquidityMulti } from '../../../src/utils/useLiquidity'
import { DashboardTable } from '../../components/Dashboard/DashboardTable'
import { useNavGrowth } from '../../components/Dashboard/utils'

const aumOptions = [
  { label: 'YTD', value: 'YTD' },
  { label: '6M', value: '180d' },
  { label: '3M', value: '90d' },
]

export default function Dashboard() {
  const theme = useTheme()
  const { selectedPools, togglePoolSelection, pools = [], setSelectedPools } = useSelectedPools()
  const filteredPools = useMemo(() => pools.filter((pool) => selectedPools.includes(pool.id)), [pools, selectedPools])
  const poolIds = useMemo(() => filteredPools.map((pool) => pool.id), [filteredPools])
  const totalNAV = useTotalNAV(filteredPools)
  const { liquidityData, isLoading } = useLiquidityMulti(poolIds)
  const [selectedAumOption, setSelectedAumOption] = useState(aumOptions[0])
  const { growth } = useNavGrowth(filteredPools, selectedAumOption.value as 'YTD' | '180d' | '90d')

  useEffect(() => {
    if (selectedPools.length === 0 && pools.length > 0) {
      setSelectedPools(pools.map((pool) => pool.id))
    }
  }, [pools.length, selectedPools.length, setSelectedPools, pools])

  const { aggregatedLockedInvestments, aggregatedLockedRedemptions } = useMemo(() => {
    return Object.values(liquidityData).reduce(
      (acc, liquidity) => {
        if (liquidity) {
          acc.aggregatedLockedInvestments = acc.aggregatedLockedInvestments.add(liquidity.sumOfLockedInvestments)
          acc.aggregatedLockedRedemptions = acc.aggregatedLockedRedemptions.add(liquidity.sumOfLockedRedemptions)
        }
        return acc
      },
      {
        aggregatedLockedInvestments: Dec(0),
        aggregatedLockedRedemptions: Dec(0),
      }
    )
  }, [liquidityData])

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: (
        <Grid display="flex" alignItems="center" height={40} gap={1}>
          <Text variant="heading4">Total AUM</Text>
          <Box display="flex" alignItems="center">
            <Box display="flex" alignItems="center" ml={1}>
              {growth && growth > 0 ? (
                <IconArrowUp color={theme.colors.statusOk} size={20} />
              ) : (
                <IconArrowDown color={theme.colors.statusCritical} size={20} />
              )}
              <Text variant="body2" color={growth > 0 ? theme.colors.statusOk : theme.colors.statusCritical}>
                {growth ? formatPercentage(growth) : '...'}
              </Text>
            </Box>
            <Select
              options={aumOptions}
              onChange={(e) =>
                setSelectedAumOption(aumOptions.find((option) => option.value === e.target.value) ?? aumOptions[0])
              }
              value={selectedAumOption.value}
              variant="secondary"
              hideBorder
              small
              style={{ paddingRight: '18px' }}
            />
          </Box>
        </Grid>
      ),
      value: `$${formatBalance(totalNAV)}`,
      heading: true,
    },
    {
      label: (
        <Box height={40} display="flex" alignItems="center">
          <Text variant="heading4">Pending investments</Text>
        </Box>
      ),
      value: `${formatBalance(aggregatedLockedInvestments)} USDC`,
      heading: true,
    },
    {
      label: (
        <Box height={40} display="flex" alignItems="center">
          <Text variant="heading4">Pending redemptions</Text>
        </Box>
      ),
      value: `${formatBalance(aggregatedLockedRedemptions)} USDC`,
      heading: true,
    },
  ]

  if (isLoading && filteredPools.length === 0) {
    return <Spinner />
  }

  return (
    <Box py={4} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Box mt={5} mb={2} display="flex" flexWrap="nowrap" overflowX="auto">
        {pools.map((pool, index) => (
          <PoolCard
            key={index}
            pool={pool}
            active={selectedPools.includes(pool.id)}
            children={
              <Checkbox
                variant="secondary"
                onChange={() => togglePoolSelection(pool.id)}
                onClick={(e) => e.stopPropagation()}
                checked={selectedPools.includes(pool.id)}
              />
            }
            onClick={() => togglePoolSelection(pool.id)}
          />
        ))}
      </Box>
      <PageSummary data={pageSummaryData} style={{ marginLeft: 0, marginRight: 0 }} />
      <DashboardTable filteredPools={filteredPools} />
    </Box>
  )
}
