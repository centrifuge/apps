import { formatBalance } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import { Spinner } from '../../../src/components/Spinner'
import { useLoans } from '../../../src/utils/useLoans'
import { AssetsTable } from '../../components/Dashboard/Assets/AssetsTable'
import { PoolSelector } from '../../components/Dashboard/PoolSelector'
import { TransformedLoan, useLoanCalculations } from '../../components/Dashboard/utils'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { useSelectedPools } from '../../utils/contexts/SelectedPoolsContext'

export default function AssetsPage() {
  const { selectedPoolIds, pools } = useSelectedPools()
  const { data: loans, isLoading } = useLoans(selectedPoolIds.length ? selectedPoolIds : [])

  const loansWithPool = loans?.map((loan) => ({
    ...loan,
    pool: pools?.find((pool) => pool.id === loan.poolId) || null,
  }))

  const filteredLoans = loansWithPool?.filter((loan) => selectedPoolIds.includes(loan.poolId)) ?? []

  const { totalAssets, offchainReserve, onchainReserve, pendingFees, totalNAV } = useLoanCalculations(
    filteredLoans as TransformedLoan[]
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

  if (!pools || !pools.length || !loans) return <Text variant="heading4">No data available</Text>

  if (isLoading) return <Spinner />

  return (
    <Box py={2} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Box mt={5} mb={2} display="flex" flexWrap="nowrap" overflowX="auto">
        <PoolSelector multiple />
      </Box>
      <PageSummary data={pageSummaryData} mx={0} />
      <AssetsTable />
    </Box>
  )
}
