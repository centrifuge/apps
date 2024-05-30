import { CurrencyBalance, Price, Rate } from '@centrifuge/centrifuge-js'
import { Button, Card, Grid, TextWithPlaceholder } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { InvestRedeemProps } from '../../../components/InvestRedeem/InvestRedeem'
import { InvestRedeemDrawer } from '../../../components/InvestRedeem/InvestRedeemDrawer'
import { IssuerSection } from '../../../components/IssuerSection'
import { LayoutBase } from '../../../components/LayoutBase'
import { LayoutSection } from '../../../components/LayoutBase/LayoutSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { Cashflows } from '../../../components/PoolOverview/Cashflows'
import { KeyMetrics } from '../../../components/PoolOverview/KeyMetrics'
import { PoolPerformance } from '../../../components/PoolOverview/PoolPerfomance'
import { PoolStructure } from '../../../components/PoolOverview/PoolStructure'
import { TrancheTokenCards } from '../../../components/PoolOverview/TrancheTokenCards'
import { TransactionHistory } from '../../../components/PoolOverview/TransactionHistory'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { getPoolValueLocked } from '../../../utils/getPoolValueLocked'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useConnectBeforeAction } from '../../../utils/useConnectBeforeAction'
import { useIsAboveBreakpoint } from '../../../utils/useIsAboveBreakpoint'
import { useLoans } from '../../../utils/useLoans'
import { usePool, usePoolFees, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export type Token = {
  poolId: string
  apy: Decimal
  protection: Decimal
  ratio: number
  name: string
  symbol: string
  seniority: number
  valueLocked: Decimal
  id: string
  capacity: CurrencyBalance
  tokenPrice: Price | null
  yield30DaysAnnualized?: string | null
}

export function PoolDetailOverviewTab() {
  return (
    <LayoutBase>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </LayoutBase>
  )
}

function AverageMaturity({ poolId }: { poolId: string }) {
  return <>{useAverageMaturity(poolId)}</>
}

export function PoolDetailOverview() {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const pool = usePool(poolId)
  const poolFees = usePoolFees(poolId)
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)
  const averageMaturity = useAverageMaturity(poolId)
  const loans = useLoans(poolId)
  const isMedium = useIsAboveBreakpoint('M')

  const pageSummaryData = [
    {
      label: <Tooltips type="assetClass" />,
      value: <TextWithPlaceholder isLoading={metadataIsLoading}>{metadata?.pool?.asset.subClass}</TextWithPlaceholder>,
    },
    { label: <Tooltips type="valueLocked" />, value: formatBalance(getPoolValueLocked(pool), pool.currency.symbol) },
  ]

  if (!isTinlakePool) {
    pageSummaryData.push({
      label: <Tooltips type="averageAssetMaturity" />,
      value: <AverageMaturity poolId={poolId} />,
    })
  }

  const tokens: Token[] = pool?.tranches
    .map((tranche) => {
      const protection = tranche.minRiskBuffer?.toDecimal() ?? Dec(0)
      return {
        poolId: tranche.poolId,
        apy: tranche?.interestRatePerSec ? tranche?.interestRatePerSec.toAprPercent() : Dec(0),
        protection: protection.mul(100),
        ratio: tranche.ratio.toFloat(),
        name: tranche.currency.name,
        symbol: tranche.currency.symbol,
        seniority: Number(tranche.seniority),
        valueLocked: tranche?.tokenPrice
          ? tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal())
          : Dec(0),
        id: tranche.id,
        capacity: tranche.capacity,
        tokenPrice: tranche.tokenPrice,
        yield30DaysAnnualized: tranche?.yield30DaysAnnualized,
      }
    })
    .reverse()

  return (
    <LayoutSection bg={theme.colors.backgroundSecondary} pt={2} pb={4}>
      <Grid height="fit-content" gridTemplateColumns={['1fr', '1fr', '66fr minmax(275px, 33fr)']} gap={[2, 2, 3]}>
        <React.Suspense fallback={<Spinner />}>
          <PoolPerformance />
        </React.Suspense>
        <React.Suspense fallback={<Spinner />}>
          <KeyMetrics
            assetType={metadata?.pool?.asset}
            averageMaturity={averageMaturity}
            loans={loans}
            poolId={poolId}
          />
        </React.Suspense>
      </Grid>
      {tokens.length > 0 && (
        <React.Suspense fallback={<Spinner />}>
          <TrancheTokenCards
            trancheTokens={tokens}
            poolId={poolId}
            createdAt={pool.createdAt}
            poolCurrencySymbol={pool.currency.symbol}
          />
        </React.Suspense>
      )}
      <React.Suspense fallback={<Spinner />}>
        <IssuerSection metadata={metadata} />
      </React.Suspense>
      {!isTinlakePool && (
        <>
          <Grid height="fit-content" gridTemplateColumns={['1fr', '1fr', '1fr 1fr']} gap={[2, 2, 3]}>
            <React.Suspense fallback={<Spinner />}>
              <PoolStructure
                numOfTranches={pool.tranches.length}
                poolId={poolId}
                poolStatus={metadata?.pool?.status}
                poolFees={
                  metadata?.pool?.poolFees?.map((fee) => {
                    return {
                      fee: poolFees?.find((f) => f.id === fee.id)?.amounts.percentOfNav ?? Rate.fromFloat(0),
                      name: fee.name,
                      id: fee.id,
                    }
                  }) || []
                }
              />
            </React.Suspense>
            {/* <React.Suspense fallback={<Spinner />}>
                <AssetsByMaturity />
              </React.Suspense> */}
          </Grid>
          {isMedium && (
            <React.Suspense fallback={<Spinner />}>
              <Card p={3}>
                <Cashflows />
              </Card>
            </React.Suspense>
          )}
          <React.Suspense fallback={<Spinner />}>
            <Card p={3}>
              <TransactionHistory poolId={poolId} />
            </Card>
          </React.Suspense>
        </>
      )}
    </LayoutSection>
  )
}

export function InvestButton(props: InvestRedeemProps) {
  const [open, setOpen] = React.useState(false)
  const connectAndOpen = useConnectBeforeAction(() => setOpen(true))
  const isMedium = useIsAboveBreakpoint('M')

  return (
    <>
      <InvestRedeemDrawer open={open} onClose={() => setOpen(false)} {...props} />
      <Button
        aria-label={`Invest in ${props.trancheId}`}
        onClick={() => connectAndOpen()}
        style={{ marginLeft: 'auto', width: isMedium ? 'auto' : ' 100%' }}
      >
        Invest
      </Button>
    </>
  )
}
