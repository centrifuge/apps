import { CurrencyBalance, Loan } from '@centrifuge/centrifuge-js'
import { Box, Button, IconChevronRight, IconDownload, IconPlus, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useNavigate, useParams } from 'react-router'
import styled from 'styled-components'
import { RouterTextLink } from '../../../../src/components/TextLink'
import { useBasePath } from '../../../../src/utils/useBasePath'
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
import { OffchainMenu } from './OffchainMenu'

const StyledRouterTextLink = styled(RouterTextLink)`
  text-decoration: unset;
  display: flex;
  align-items: center;
`

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
  const navigate = useNavigate()

  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const isTinlakePool = poolId.startsWith('0x')
  const basePath = useBasePath()
  const cashLoans = (loans ?? []).filter(
    (loan) => 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash'
  )

  if (!pool) return null

  if (!loans?.length) {
    return (
      <Shelf p={4} gap={2}>
        <Text>No assets have been originated yet</Text>
        <CreateAssetButton poolId={poolId} />
      </Shelf>
    )
  }

  const hasValuationMethod = (pricing: any): pricing is { valuationMethod: string; presentValue: CurrencyBalance } => {
    return pricing && typeof pricing.valuationMethod === 'string'
  }

  const getAmount = (loan: Loan) => {
    switch (loan.status) {
      case 'Closed':
        return loan.totalRepaid

      case 'Active':
        return loan.presentValue ?? (loan.outstandingDebt.isZero() ? loan.totalRepaid : loan.outstandingDebt)

      case 'Created':
        return 0

      default:
        return pool.reserve.total
    }
  }

  const totalAssets = loans.reduce((sum, loan) => {
    const amount = new CurrencyBalance(getAmount(loan as Loan), pool.currency.decimals).toDecimal()

    return sum.add(amount)
  }, Dec(0))

  const offchainAssets = !isTinlakePool
    ? loans.filter(
        (loan) => hasValuationMethod((loan as Loan).pricing) && (loan as Loan).pricing.valuationMethod === 'cash'
      )
    : null
  const offchainReserve = offchainAssets?.reduce<any>(
    (curr, prev) => curr.add(prev.status === 'Active' ? prev.outstandingDebt.toDecimal() : Dec(0)),
    Dec(0)
  )

  const totalPresentValue = loans.reduce((sum, loan) => {
    if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash') {
      return sum.add(loan.pricing.presentValue?.toDecimal() || Dec(0))
    }
    return sum
  }, Dec(0))

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: `Total NAV (${pool.currency.symbol})`,
      value: formatBalance(pool.nav.total.toDecimal()),
      heading: true,
    },
    {
      label: <Tooltips label={`Onchain reserve (${pool.currency.symbol})`} type="onchainReserve" />,
      value: (
        <StyledRouterTextLink to={`${basePath}/${pool.id}/assets/0`}>
          <Text>{formatBalance(pool.reserve.total || 0)}</Text>
          <IconChevronRight size={20} />
        </StyledRouterTextLink>
      ),
      heading: false,
    },
    ...(!isTinlakePool && cashLoans.length
      ? [
          {
            label: <Tooltips label={`Offchain cash (${pool.currency.symbol})`} type="offchainCash" />,
            value: <OffchainMenu value={formatBalance(offchainReserve)} loans={cashLoans} />,
            heading: false,
          },
          {
            label: `Total Assets (${pool.currency.symbol})`,
            value: formatBalance(totalAssets),
            heading: false,
          },
        ]
      : []),
  ]

  return (
    <>
      <PageSummary data={pageSummaryData}>
        <CreateAssetButton poolId={poolId} />
      </PageSummary>
      <Box
        paddingX={1}
        paddingLeft={3}
        paddingRight={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text variant="heading4">Assets</Text>
        <Box display="flex">
          <Button
            variant="inverted"
            style={{ marginRight: 12 }}
            small
            onClick={() => navigate(`${basePath}/${poolId}/data/asset-tx`)}
          >
            View asset transactions
          </Button>
          <Button variant="inverted" icon={<IconDownload size={20} />} small>
            Download
          </Button>
        </Box>
      </Box>
      <Box padding={3}>
        <LoanList loans={loans} />
      </Box>
    </>
  )
}

function CreateAssetButton({ poolId }: { poolId: string }) {
  const canCreateAssets = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['Borrow'] }).length > 0

  return canCreateAssets ? (
    <RouterLinkButton to={`/issuer/${poolId}/assets/create`} small icon={<IconPlus />}>
      Create assets
    </RouterLinkButton>
  ) : null
}
