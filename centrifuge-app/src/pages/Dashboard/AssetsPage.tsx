import { Box, Checkbox, Text } from '@centrifuge/fabric'
import { useEffect } from 'react'
import { PoolCard } from '../../../src/components/Dashboard/PoolCard'
import { AssetsProvider } from '../../../src/components/Dashboard/assets/AssetsContext'
import { PageSummary } from '../../../src/components/PageSummary'
import { Spinner } from '../../../src/components/Spinner'
import { Tooltips } from '../../../src/components/Tooltips'
import { useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import { formatBalance } from '../../../src/utils/formatting'
import { useLoans } from '../../../src/utils/useLoans'
import AssetsTable from '../../components/Dashboard/assets/AssetsTable'
import { TransformedLoan, useLoanCalculations } from '../../components/Dashboard/assets/utils'

export default function AssetsPage() {
  const { selectedPools, togglePoolSelection, setSelectedPools, pools = [] } = useSelectedPools()
  const ids = pools.map((pool) => pool.id)
  const { data: loans, isLoading } = useLoans(pools ? ids : [])

  useEffect(() => {
    if (selectedPools.length === 0 && pools.length > 0) {
      setSelectedPools(pools.map((pool) => pool.id))
    }
  }, [])

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

  if (isLoading || !loans || !pools.length) return <Spinner />

  return (
    <AssetsProvider>
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
        <AssetsTable loans={loansWithPool as TransformedLoan[]} />
      </Box>
    </AssetsProvider>
  )
}
