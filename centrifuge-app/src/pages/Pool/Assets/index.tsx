import { CurrencyBalance, Loan } from '@centrifuge/centrifuge-js'
import { Box, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { RouterTextLink } from '../../../../src/components/TextLink'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList, getAmount } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'
import { OffchainMenu } from './OffchainMenu'

export const StyledRouterTextLink = styled(RouterTextLink)`
  text-decoration: unset;
  display: flex;
  align-items: center;
  &:hover {
    text-decoration: underline;
  }
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

  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const { data: loans } = useLoans([poolId])
  const isTinlakePool = poolId.startsWith('0x')
  const cashLoans = (loans ?? []).filter(
    (loan) => 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'cash'
  )

  if (!pool) return null

  if (!loans?.length) {
    return (
      <Shelf p={4} gap={2}>
        <Text>No assets have been originated yet</Text>
      </Shelf>
    )
  }

  const hasValuationMethod = (pricing: any): pricing is { valuationMethod: string; presentValue: CurrencyBalance } => {
    return pricing && typeof pricing.valuationMethod === 'string'
  }

  const totalAssets = loans.reduce((sum, loan) => {
    const amount =
      hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash'
        ? new CurrencyBalance(getAmount(loan as any, pool, false, true), pool.currency.decimals).toDecimal()
        : 0

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

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: `Total NAV (${pool.currency.symbol})`,
      value: formatBalance(pool.nav.total),
      heading: true,
    },
    {
      label: <Tooltips label={`Onchain reserve (${pool.currency.symbol})`} type="onchainReserve" />,
      value: (
        <StyledRouterTextLink to={`pools/${pool.id}/assets/0`}>
          <Text>{formatBalance(pool.reserve.total || 0)}</Text>
          <IconChevronRight size={20} />
        </StyledRouterTextLink>
      ),
      heading: false,
    },
    ...(!isTinlakePool && cashLoans.length
      ? [
          {
            label: <Tooltips label="Offchain cash (USD)" type="offchainCash" />,
            value: <OffchainMenu value={formatBalance(offchainReserve)} loans={cashLoans as Loan[]} />,
            heading: false,
          },
          {
            label: `Total Assets (${pool.currency.symbol})`,
            value: formatBalance(totalAssets),
            heading: false,
          },
          {
            label: `Total pending fees (${pool.currency.symbol})`,
            value: `${pool.fees.totalPending.isZero() ? 0 : formatBalance(pool.fees.totalPending)}`,
            heading: false,
          },
        ]
      : []),
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <Box>
        <LoanList loans={loans} />
      </Box>
    </>
  )
}
