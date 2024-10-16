import { ActiveLoan, Loan } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import currencyDollar from '../../../assets/images/currency-dollar.svg'
import daiLogo from '../../../assets/images/dai-logo.svg'
import usdcLogo from '../../../assets/images/usdc-logo.svg'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { useLoans } from '../../../utils/useLoans'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export function PoolDetailAssetsTab() {
  return (
    <>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </>
  )
}

export function PoolDetailAssets() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const isTinlakePool = poolId.startsWith('0x')

  if (!pool) return null

  if (!loans?.length) {
    return (
      <Shelf p={4} gap={2}>
        <Text>No assets have been originated yet</Text>
        <CreateAssetButton poolId={poolId} />
      </Shelf>
    )
  }

  function hasValuationMethod(pricing: any): pricing is { valuationMethod: string } {
    return pricing && typeof pricing.valuationMethod === 'string'
  }

  const ongoingAssets = (loans &&
    [...loans].filter(
      (loan) =>
        loan.status === 'Active' &&
        hasValuationMethod(loan.pricing) &&
        loan.pricing.valuationMethod !== 'cash' &&
        !loan.outstandingDebt.isZero()
    )) as ActiveLoan[]

  const offchainAssets = !isTinlakePool
    ? loans.filter(
        (loan) => hasValuationMethod((loan as Loan).pricing) && (loan as Loan).pricing.valuationMethod === 'cash'
      )
    : null
  const offchainReserve = offchainAssets?.reduce<any>(
    (curr, prev) => curr.add(prev.status === 'Active' ? prev.outstandingDebt.toDecimal() : Dec(0)),
    Dec(0)
  )

  const overdueAssets = loans.filter(
    (loan) =>
      loan.status === 'Active' &&
      loan.outstandingDebt.gtn(0) &&
      loan.pricing.maturityDate &&
      new Date(loan.pricing.maturityDate).getTime() < Date.now()
  )

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode }[] = [
    {
      label: <Tooltips type="totalNav" />,
      value: formatBalance(pool.nav.total.toDecimal(), pool.currency.symbol),
    },
    {
      label: (
        <Shelf alignItems="center" gap="2px">
          <Box as="img" src={isTinlakePool ? daiLogo : usdcLogo} alt="" height={13} width={13} />
          <Tooltips type="onchainReserve" />
        </Shelf>
      ),
      value: formatBalance(pool.reserve.total || 0, pool.currency.symbol),
    },
    ...(!isTinlakePool
      ? [
          {
            label: (
              <Shelf alignItems="center" gap="2px">
                <Box as="img" src={currencyDollar} alt="" height={13} width={13} />
                <Tooltips type="offchainCash" />
              </Shelf>
            ),
            value: formatBalance(offchainReserve, 'USD'),
          },
          {
            label: 'Total assets',
            value: loans.filter((loan) => hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash')
              .length,
          },
          { label: <Tooltips type="ongoingAssets" />, value: ongoingAssets.length || 0 },
          {
            label: 'Overdue assets',
            value: <Text color={overdueAssets.length > 0 ? 'statusCritical' : 'inherit'}>{overdueAssets.length}</Text>,
          },
        ]
      : []),
  ]

  return (
    <>
      <PageSummary data={pageSummaryData}>
        <CreateAssetButton poolId={poolId} />
      </PageSummary>
      <Box px="5" py="2">
        <LoanList loans={loans} />
      </Box>
    </>
  )
}

function CreateAssetButton({ poolId }: { poolId: string }) {
  const canCreateAssets = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['Borrow'] }).length > 0

  return canCreateAssets ? (
    <RouterLinkButton to={`/issuer/${poolId}/assets/create`} small>
      Create asset
    </RouterLinkButton>
  ) : null
}
