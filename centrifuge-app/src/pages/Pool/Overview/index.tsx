import { CurrencyBalance, Price } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, Grid, TextWithPlaceholder } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { InvestRedeemContext, InvestRedeemProvider } from '../../../../src/components/InvestRedeem/InvestRedeemProvider'
import { InvestRedeemProps } from '../../../components/InvestRedeem/InvestRedeem'
import { InvestRedeemDrawer } from '../../../components/InvestRedeem/InvestRedeemDrawer'
import { IssuerDetails, ReportDetails } from '../../../components/IssuerSection'
import { LayoutSection } from '../../../components/LayoutBase/LayoutSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { KeyMetrics } from '../../../components/PoolOverview/KeyMetrics'
import { PoolPerformance } from '../../../components/PoolOverview/PoolPerfomance'
import { TrancheTokenCards } from '../../../components/PoolOverview/TrancheTokenCards'
import { TransactionHistory } from '../../../components/PoolOverview/TransactionHistory'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { getPoolValueLocked } from '../../../utils/getPoolValueLocked'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useConnectBeforeAction } from '../../../utils/useConnectBeforeAction'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
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

const FullHeightLayoutSection = styled(LayoutSection)`
  flex: 1;
  display: flex;
  flex-direction: column;
`

export function PoolDetailOverviewTab() {
  return (
    <>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </>
  )
}

function AverageMaturity({ poolId }: { poolId: string }) {
  return <>{useAverageMaturity(poolId)}</>
}

export function PoolDetailOverview() {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const isTinlakePool = poolId.startsWith('0x')
  const pool = usePool(poolId)
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)

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
        yield30DaysAnnualized: tranche?.yield30DaysAnnualized?.toString() || '',
      }
    })
    .reverse()

  return (
    <FullHeightLayoutSection bg={theme.colors.backgroundPage}>
      <Box>
        <Grid height="fit-content" gridTemplateColumns={['1fr', '1fr', '66fr minmax(275px, 33fr)']} gap={[2, 2, 3]}>
          <PoolPerformance />
          <React.Suspense fallback={<Spinner />}>
            <KeyMetrics poolId={poolId} />
          </React.Suspense>
        </Grid>
        {tokens.length > 0 && (
          <React.Suspense fallback={<Spinner />}>
            <TrancheTokenCards trancheTokens={tokens} poolId={poolId} metadata={metadata} />
          </React.Suspense>
        )}
        <React.Suspense fallback={<Spinner />}>
          <Grid gridTemplateColumns={'1fr 0.5fr'} gap={2} marginY={3}>
            <Card p={3} backgroundColor="backgroundSecondary">
              <IssuerDetails metadata={metadata} />
            </Card>
            {metadata?.pool?.reports?.length || !isTinlakePool ? (
              <Card p={3} backgroundColor="backgroundButtonSecondary">
                <ReportDetails metadata={metadata} />
              </Card>
            ) : null}
          </Grid>
        </React.Suspense>
        {!isTinlakePool && (
          <React.Suspense fallback={<Spinner />}>
            <TransactionHistory poolId={poolId} />
          </React.Suspense>
        )}
      </Box>
    </FullHeightLayoutSection>
  )
}

export function InvestButton(props: InvestRedeemProps) {
  const { poolId, trancheId, metadata } = props
  const [open, setOpen] = React.useState(false)
  const connectAndOpen = useConnectBeforeAction(() => setOpen(true))
  const { connectedType, showNetworks } = useWallet()

  return (
    <>
      <InvestRedeemDrawer open={open} onClose={() => setOpen(false)} {...props} />
      <InvestRedeemProvider poolId={poolId} trancheId={trancheId}>
        <InvestRedeemContext.Consumer>
          {({ state }) => {
            if (!state.isAllowedToInvest && connectedType !== null) {
              return (
                <Button onClick={() => window.open(metadata?.onboarding?.externalOnboardingUrl)} variant="primary">
                  Onboard
                </Button>
              )
            } else if (connectedType === null) {
              return (
                <Button onClick={() => showNetworks()} variant="primary">
                  Connect
                </Button>
              )
            } else {
              return (
                <Button
                  aria-label={`Invest in ${props.trancheId}`}
                  onClick={() => connectAndOpen()}
                  style={{ marginLeft: 'auto', width: '120px' }}
                >
                  {state.isFirstInvestment ? 'Invest' : 'Invest/Redeem'}
                </Button>
              )
            }
          }}
        </InvestRedeemContext.Consumer>
      </InvestRedeemProvider>
    </>
  )
}
