import { Network, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { Faucet } from '../../../components/Faucet'
import { ActionsRef, InvestRedeem } from '../../../components/InvestRedeem/InvestRedeem'
import { IssuerSection } from '../../../components/IssuerSection'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolToken } from '../../../components/PoolToken'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { ethConfig } from '../../../config'
import { formatDate, getAge } from '../../../utils/date'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../../utils/formatting'
import { getPoolValueLocked } from '../../../utils/getPoolValueLocked'
import { useTinlakePermissions } from '../../../utils/tinlake/useTinlakePermissions'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const PoolAssetReserveChart = React.lazy(() => import('../../../components/Charts/PoolAssetReserveChart'))

export function PoolDetailOverviewTab() {
  const { state } = useLocation<{ token: string }>()
  const [selectedToken, setSelectedToken] = React.useState(state?.token)

  const investRef = React.useRef<{ setView(view: 'invest' | 'redeem'): void }>()

  function setToken(token: string) {
    setSelectedToken(token)
    investRef.current?.setView('invest')
  }

  return (
    <PageWithSideBar
      sidebar={
        <>
          <Faucet />
          <PoolDetailSideBar selectedToken={selectedToken} setSelectedToken={setSelectedToken} investRef={investRef} />
        </>
      }
    >
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview selectedToken={selectedToken} setSelectedToken={setToken} />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export function PoolDetailSideBar({
  selectedToken,
  setSelectedToken,
  investRef,
}: {
  selectedToken?: string
  setSelectedToken?: (token: string) => void
  investRef?: ActionsRef
}) {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const tinlakeNetworks = [ethConfig.network === 'goerli' ? 5 : 1] as Network[]
  // TODO: fetch supported networks from centrifuge chain
  const centrifugeNetworks = ['centrifuge', 84531] as Network[]

  return (
    <InvestRedeem
      poolId={poolId}
      trancheId={selectedToken}
      onSetTrancheId={setSelectedToken}
      networks={isTinlakePool ? tinlakeNetworks : centrifugeNetworks}
      actionsRef={investRef}
    />
  )
}

function AverageMaturity({ poolId }: { poolId: string }) {
  return <>{useAverageMaturity(poolId)}</>
}

export function PoolDetailOverview({
  setSelectedToken,
}: {
  selectedToken?: string | null
  setSelectedToken?: (token: string) => void
}) {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isTinlakePool = poolId.startsWith('0x')
  const { state } = useLocation<{ token: string }>()
  const pool = usePool(poolId)
  const { data: metadata, isLoading: metadataIsLoading } = usePoolMetadata(pool)
  const { showNetworks, connectedType, evm } = useWallet()
  const { data: tinlakePermissions } = useTinlakePermissions(poolId, evm?.selectedAddress || '')

  const pageSummaryData = [
    {
      label: <Tooltips type="assetClass" />,
      value: <TextWithPlaceholder isLoading={metadataIsLoading}>{metadata?.pool?.asset.class}</TextWithPlaceholder>,
    },
    { label: <Tooltips type="valueLocked" />, value: formatBalance(getPoolValueLocked(pool), pool.currency.symbol) },
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
        apr: tranche?.interestRatePerSec ? tranche?.interestRatePerSec.toAprPercent() : Dec(0),
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
                      value={formatPercentage(token.apr)}
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
                  {setSelectedToken && getTrancheAvailability(token.id) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (!connectedType) {
                          showNetworks()
                        }
                        setSelectedToken(token.id)
                      }}
                      style={{ marginLeft: 'auto' }}
                    >
                      Invest
                    </Button>
                  )}
                </Shelf>
              </PoolToken>
            </div>
          ))}
        </Stack>
      </PageSection>
      <PageSection title="Issuer">
        <IssuerSection metadata={metadata} />
      </PageSection>
    </>
  )
}
