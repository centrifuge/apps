import { useBalances } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Button,
  IconExternalLink,
  InteractiveCard,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
  Thumbnail,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { InvestRedeem } from '../../../components/InvestRedeem'
import { IssuerSection } from '../../../components/IssuerSection'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import RiskGroupList from '../../../components/RiskGroupList'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { formatDate, getAge } from '../../../utils/date'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../../utils/formatting'
import { useAddress } from '../../../utils/useAddress'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { usePermissions } from '../../../utils/usePermissions'
import { usePendingCollectMulti, usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const PoolAssetReserveChart = React.lazy(() => import('../../../components/Charts/PoolAssetReserveChart'))
const PriceYieldChart = React.lazy(() => import('../../../components/Charts/PriceYieldChart'))

export const PoolDetailOverviewTab: React.FC = () => {
  const { state } = useLocation<{ token: string }>()
  const [selectedToken, setSelectedToken] = React.useState(state?.token || null)

  return (
    <PageWithSideBar
      sidebar={
        <PoolDetailSideBar selectedToken={selectedToken} setSelectedToken={setSelectedToken} key={selectedToken} />
      }
    >
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview selectedToken={selectedToken} setSelectedToken={setSelectedToken} />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const CentrifugeInvestBox: React.FC<{
  selectedToken: string | null
  setSelectedToken: (token: string | null) => void
}> = ({ selectedToken, setSelectedToken }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const address = useAddress()
  const permissions = usePermissions(address)
  const balances = useBalances(address)

  const seniorityMap: Record<string, number> = {}
  pool?.tranches.forEach((t) => (seniorityMap[t.id] = t.seniority))
  const allowedTrancheIds = Object.keys(pool ? permissions?.pools[poolId]?.tranches ?? {} : {}).sort((a, b) => {
    const seniorityA = seniorityMap[a]
    const seniorityB = seniorityMap[b]
    return seniorityB - seniorityA
  })

  const orders = usePendingCollectMulti(poolId, allowedTrancheIds, address)

  const hasInvestments = allowedTrancheIds.map((tid, i) => {
    const trancheBalance =
      balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === tid)?.balance.toDecimal() ?? Dec(0)
    const order = orders?.[tid]
    const investToCollect = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
    const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)
    const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
    return !combinedBalance.isZero()
  })
  const hasAnyInvestment = hasInvestments.some((inv) => inv)

  if (pool && permissions && selectedToken && !allowedTrancheIds.includes(selectedToken)) {
    // TODO: Redirect to onboarding
    return <InvestRedeem poolId={poolId} trancheId={selectedToken} key="notallowed" />
  }

  if (pool && permissions && !allowedTrancheIds.length) {
    // TODO: Show onboarding card
    return <InvestRedeem poolId={poolId} key="notallowed" />
  }

  if (allowedTrancheIds.length && orders && !hasAnyInvestment) {
    return (
      <InvestRedeem
        poolId={poolId}
        defaultTrancheId={selectedToken ?? undefined}
        autoFocus={!!selectedToken}
        key={`1-${selectedToken}`}
      />
    )
  }

  if (allowedTrancheIds.length && orders && hasAnyInvestment) {
    return (
      <Stack gap={2}>
        {allowedTrancheIds.map((tid, i) => {
          if (hasInvestments[i] || tid === selectedToken) {
            return (
              <InvestRedeemBox
                poolId={poolId}
                tokenId={tid}
                selectedToken={selectedToken}
                setSelectedToken={setSelectedToken}
                key={`2-${tid}-${selectedToken}`}
              />
            )
          }
          return null
        })}
      </Stack>
    )
  }

  return null
}
export const PoolDetailSideBar: React.FC<{
  selectedToken: string | null
  setSelectedToken: (token: string | null) => void
}> = ({ selectedToken, setSelectedToken }) => {
  const { pid: poolId } = useParams<{ pid: string }>()

  // TODO: Tinlake invest box
  if (poolId.startsWith('0x')) return null

  return <CentrifugeInvestBox selectedToken={selectedToken} setSelectedToken={setSelectedToken} />
}

const InvestRedeemBox: React.FC<{
  selectedToken: string | null
  setSelectedToken: (token: string | null) => void
  poolId: string
  tokenId: string
}> = ({ selectedToken, setSelectedToken, tokenId, poolId }) => {
  const [view, setViewState] = React.useState<'start' | 'invest' | 'redeem'>(
    selectedToken === tokenId ? 'invest' : 'start'
  )
  function setView(value: React.SetStateAction<'start' | 'invest' | 'redeem'>) {
    const newView = typeof value === 'function' ? value(view) : value
    setViewState(newView)
    if (newView === 'start') {
      setSelectedToken(null)
    } else if (newView === 'invest') {
      setSelectedToken(tokenId)
    }
  }
  return <InvestRedeem poolId={poolId} trancheId={tokenId} view={view} onSetView={setView} autoFocus />
}

const AverageMaturity: React.FC<{ poolId: string }> = ({ poolId }) => {
  return <>{useAverageMaturity(poolId)}</>
}

export const PoolDetailOverview: React.FC<{
  selectedToken?: string | null
  setSelectedToken?: (token: string | null) => void
}> = ({ setSelectedToken }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const { state } = useLocation<{ token: string }>()
  const pool = usePool(poolId)
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)
  const address = useAddress()
  const permissions = usePermissions(address)

  const pageSummaryData = [
    {
      label: <Tooltips type="assetClass" />,
      value: <TextWithPlaceholder isLoading={metadataIsLoading}>{metadata?.pool?.asset.class}</TextWithPlaceholder>,
    },
    { label: <Tooltips type="valueLocked" />, value: formatBalance(pool?.value || 0, pool?.currency.symbol) },
  ]

  if (!isTinlakePool) {
    pageSummaryData.push({
      label: <Tooltips type="averageAssetMaturity" />,
      value: <AverageMaturity poolId={poolId} />,
    })
  }
  if (pool?.createdAt) {
    pageSummaryData.splice(2, 0, { label: <Tooltips type="age" />, value: getAge(pool.createdAt) })
  }

  const tokens = pool?.tranches
    .map((tranche) => {
      const protection = tranche.minRiskBuffer?.toDecimal() ?? Dec(0)
      return {
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
      }
    })
    .reverse()

  const hasScrolledToToken = React.useRef(false)
  function handleTokenMount(node: HTMLDivElement, id: string) {
    if (hasScrolledToToken.current === true || id !== state?.token) return
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    hasScrolledToToken.current = true
  }

  return (
    <>
      <PageSummary data={pageSummaryData} />
      {!isTinlakePool && (
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
              <InteractiveCard
                isOpen={i === 0}
                variant="collapsible"
                icon={<Thumbnail label={token.symbol ?? ''} type="token" />}
                title={<Text>{token.name}</Text>}
                secondaryHeader={
                  <Shelf gap={6}>
                    <LabelValueStack
                      label={<Tooltips variant="secondary" type="protection" />}
                      value={formatPercentage(token.protection)}
                    />
                    <LabelValueStack
                      label={<Tooltips variant="secondary" type="valueLocked" />}
                      value={formatBalance(token.valueLocked, pool?.currency.symbol)}
                    />
                    <LabelValueStack
                      label={<Tooltips variant="secondary" type="apy" />}
                      value={formatPercentage(token.apy)}
                    />
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
                    {setSelectedToken && (
                      <Button
                        variant={i === 0 ? 'primary' : 'secondary'}
                        onClick={() => setSelectedToken(token.id)}
                        style={{ marginLeft: 'auto' }}
                        disabled={!permissions?.pools[poolId]?.tranches[token.id]}
                      >
                        Invest
                      </Button>
                    )}
                  </Shelf>
                }
              >
                <Stack maxHeight="300px">
                  <React.Suspense fallback={<Spinner />}>
                    <PriceYieldChart trancheId={token.id} />
                  </React.Suspense>
                </Stack>
              </InteractiveCard>
            </div>
          ))}
        </Stack>
      </PageSection>
      <PageSection
        title="Issuer"
        headerRight={
          <AnchorButton
            variant="secondary"
            icon={IconExternalLink}
            href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/account/${address}`}
            target="_blank"
            small
            disabled={!address}
          >
            View pool account
          </AnchorButton>
        }
      >
        <IssuerSection metadata={metadata} />
      </PageSection>
      {!isTinlakePool && (
        <PageSection title=" Asset portfolio" titleAddition="By risk groups">
          <RiskGroupList />
        </PageSection>
      )}
    </>
  )
}
