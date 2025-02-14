import { Box, Text } from '@centrifuge/fabric'
import { useEffect } from 'react'
import { PageSummary } from '../../../src/components/PageSummary'
import { Spinner } from '../../../src/components/Spinner'
import { Tooltips } from '../../../src/components/Tooltips'
import { useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import { formatBalance } from '../../../src/utils/formatting'
import { useLoans } from '../../../src/utils/useLoans'
import AssetsTable from '../../components/Dashboard/Assets/AssetsTable'
import { PoolSelector } from '../../components/Dashboard/PoolSelector'
import { TransformedLoan, useLoanCalculations } from '../../components/Dashboard/utils'

export default function AssetsPage() {
  const { selectedPools, setSelectedPools, pools = [] } = useSelectedPools()
  const ids = pools.map((pool) => pool.id)
  const { data: loans, isLoading } = useLoans(pools ? ids : [])

  // TODO - replace with Sophia's code once merged
  useEffect(() => {
    if (selectedPools.length === 0 && pools.length > 0) {
      setSelectedPools(pools.map((pool) => pool.id))
    }
  }, [pools.length, selectedPools.length, setSelectedPools, pools])

  const poolMap = pools.reduce<Record<string, (typeof pools)[number]>>((map, pool) => {
    map[pool.id] = pool
    return map
  }, {})

  const loansWithPool = loans?.map((loan) => ({
    ...loan,
    pool: poolMap[loan.poolId] || null,
  }))

  const filteredPools = loansWithPool?.filter((loan) => selectedPools.includes(loan.poolId)) ?? []

  const { totalAssets, offchainReserve, onchainReserve, pendingFees, totalNAV } = useLoanCalculations(
    filteredPools as TransformedLoan[]
  )

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: `Total NAV`,
      value: `${formatBalance(totalNAV)} USDC`,
      heading: true,
    },
    {
      label: <Tooltips label={`Onchain reserve`} type="onchainReserve" />,
      value: <Text>{formatBalance(onchainReserve)} USDC</Text>,
      heading: false,
    },

    {
      label: <Tooltips label="Offchain cash" type="offchainCash" />,
      value: <Text>{formatBalance(offchainReserve)} USDC</Text>,
      heading: false,
    },
    {
      label: `Total Assets`,
      value: <Text>{formatBalance(totalAssets)} USDC</Text>,
      heading: false,
    },
    {
      label: `Total pending fees (USDC)`,
      value: `${pendingFees.isZero() ? '' : '-'}${formatBalance(pendingFees)} USDC`,
      heading: false,
    },
  ]

  if (!pools.length || !loans) return <Text variant="heading4">No data available</Text>

  if (isLoading) return <Spinner />

  return (
    <Box py={4} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Box mt={5} mb={2} display="flex" flexWrap="nowrap" overflowX="auto">
        <PoolSelector multiple />
      </Box>
      <PageSummary data={pageSummaryData} style={{ marginLeft: 0, marginRight: 0 }} />
      <AssetsTable loans={loansWithPool as TransformedLoan[]} />
    </Box>
  )
}
