import { CurrencyBalance, Price } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Grid, TextWithPlaceholder } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { InvestRedeemProps } from '../../../components/InvestRedeem/InvestRedeem'
import { InvestRedeemDrawer } from '../../../components/InvestRedeem/InvestRedeemDrawer'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { AssetsByMaturity } from '../../../components/PoolOverview/AssetsByMaturity'
import { Cashflows } from '../../../components/PoolOverview/Cashflows'
import { KeyMetrics } from '../../../components/PoolOverview/KeyMetrics'
import { PoolAnalysis } from '../../../components/PoolOverview/PoolAnalysis'
import { PoolPerformance } from '../../../components/PoolOverview/PoolPerfomance'
import { PoolStructure } from '../../../components/PoolOverview/PoolStructure'
import { TrancheTokenCards } from '../../../components/PoolOverview/TrancheTokenCards'
import { TransactionHistory } from '../../../components/PoolOverview/TransactionHistory'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance } from '../../../utils/formatting'
import { getPoolValueLocked } from '../../../utils/getPoolValueLocked'
import { useTinlakePermissions } from '../../../utils/tinlake/useTinlakePermissions'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useConnectBeforeAction } from '../../../utils/useConnectBeforeAction'
import { useLoans } from '../../../utils/useLoans'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const PoolAssetReserveChart = React.lazy(() => import('../../../components/Charts/PoolAssetReserveChart'))

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
  const { state } = useLocation<{ token: string }>()
  const pool = usePool(poolId)
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)
  const { evm } = useWallet()
  const { data: tinlakePermissions } = useTinlakePermissions(poolId, evm?.selectedAddress || '')
  const averageMaturity = useAverageMaturity(poolId)
  const loans = useLoans(poolId)

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

  const hasScrolledToToken = React.useRef(false)
  function handleTokenMount(node: HTMLDivElement, id: string) {
    if (hasScrolledToToken.current === true || id !== state?.token) return
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    hasScrolledToToken.current = true
  }

  const getTrancheAvailability = (token: string) => {
    if (isTinlakePool && metadata?.pool?.newInvestmentsStatus) {
      const trancheName = token.split('-')[1] === '0' ? 'junior' : 'senior'

      const isMember = tinlakePermissions?.[trancheName].inMemberlist

      return isMember || metadata.pool.newInvestmentsStatus[trancheName] !== 'closed'
    }

    return true
  }

  return (
    <Box bg={theme.colors.backgroundSecondary} pt={2} pb={4}>
      <PoolOverviewSection>
        <Grid height={352} gridTemplateColumns={'66fr 33fr'} gap={3}>
          <React.Suspense fallback={<Spinner />}>
            <PoolPerformance />
          </React.Suspense>
          <React.Suspense fallback={<Spinner />}>
            <KeyMetrics assetType={metadata?.pool?.asset} averageMaturity={averageMaturity} loans={loans} />
          </React.Suspense>
        </Grid>
      </PoolOverviewSection>
      {tokens.length > 0 && (
        <PoolOverviewSection>
          <React.Suspense fallback={<Spinner />}>
            <TrancheTokenCards
              trancheTokens={tokens}
              poolId={poolId}
              createdAt={pool.createdAt}
              poolCurrencySymbol={pool.currency.symbol}
            />
          </React.Suspense>
        </PoolOverviewSection>
      )}
      <PoolOverviewSection>
        <React.Suspense fallback={<Spinner />}>
          <PoolAnalysis />
        </React.Suspense>
      </PoolOverviewSection>
      <PoolOverviewSection>
        <Grid height={289} gridTemplateColumns={'1fr 1fr'} gap={3}>
          <React.Suspense fallback={<Spinner />}>
            <PoolStructure />
          </React.Suspense>
          <React.Suspense fallback={<Spinner />}>
            <AssetsByMaturity />
          </React.Suspense>
        </Grid>
      </PoolOverviewSection>
      <PoolOverviewSection>
        <React.Suspense fallback={<Spinner />}>
          <Box height={373}>
            <Cashflows />
          </Box>
        </React.Suspense>
      </PoolOverviewSection>
      <PoolOverviewSection>
        <React.Suspense fallback={<Spinner />}>
          <Box height={447}>
            <TransactionHistory />
          </Box>
        </React.Suspense>
      </PoolOverviewSection>
      {/* {!isTinlakePool && (
        <PageSection title="Pool value, asset value & reserve" titleAddition={formatDate(new Date().toString())}>
          <Stack height="290px">
            <React.Suspense fallback={<Spinner />}>
              <PoolAssetReserveChart />
            </React.Suspense>
          </Stack>
        </PageSection>
      )}
      <PageSection title="Pool tokens">
        <Stack gap={2}>
          {tokens?.map((token, i) => (
            <div key={token.id} ref={(node) => node && handleTokenMount(node, token.id)}>
              <PoolToken token={token} defaultOpen={i === 0}>
                <Shelf gap={6}>
                  <LabelValueStack
                    label={<Tooltips variant="secondary" type="subordination" />}
                    value={formatPercentage(token.protection)}
                  />
                  <LabelValueStack
                    label={<Tooltips variant="secondary" type="valueLocked" />}
                    value={formatBalance(token.valueLocked, pool?.currency.symbol)}
                  />
                  {token.seniority === 0 ? (
                    <LabelValueStack
                      label={<Tooltips variant="secondary" type="juniorTrancheYields" />}
                      value="Variable"
                    />
                  ) : (
                    <LabelValueStack
                      label={<Tooltips variant="secondary" type="seniorTokenAPR" />}
                      value={formatPercentage(token.apy)}
                    />
                  )}
                  <LabelValueStack
                    label="Capacity"
                    value={
                      <Text
                        variant="body2"
                        fontWeight={600}
                        color={token.capacity.isZero() ? 'statusWarning' : 'statusOk'}
                      >
                        {formatBalanceAbbreviated(token.capacity, pool?.currency.symbol)}
                      </Text>
                    }
                  />
                  <LabelValueStack
                    label="Token price"
                    value={
                      <TextWithPlaceholder isLoading={!token.tokenPrice}>
                        {token.tokenPrice && formatBalance(token.tokenPrice, pool?.currency.symbol, 4, 2)}
                      </TextWithPlaceholder>
                    }
                  />
                  {getTrancheAvailability(token.id) && <InvestButton poolId={poolId} trancheId={token.id} />}
                </Shelf>
              </PoolToken>
            </div>
          ))}
        </Stack>
      </PageSection>
      <PageSection title="Issuer">
        <IssuerSection metadata={metadata} />
      </PageSection> */}
    </Box>
  )
}

export function InvestButton(props: InvestRedeemProps) {
  const [open, setOpen] = React.useState(false)
  const connectAndOpen = useConnectBeforeAction(() => setOpen(true))

  return (
    <>
      <InvestRedeemDrawer open={open} onClose={() => setOpen(false)} {...props} />
      <Button onClick={() => connectAndOpen()} style={{ marginLeft: 'auto' }}>
        Invest
      </Button>
    </>
  )
}

const PoolOverviewSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box px={3} py={1}>
      {children}
    </Box>
  )
}
