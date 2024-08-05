import { CurrencyKey } from '@centrifuge/centrifuge-js'
import {
  ConnectionGuard,
  useCentrifugeApi,
  useCentrifugeTransaction,
  useGetExplorerUrl,
  useGetNetworkName,
  useNetworkName,
} from '@centrifuge/centrifuge-react'
import { Accordion, Button, IconExternalLink, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { combineLatest, switchMap } from 'rxjs'
import { PageSection } from '../../../components/PageSection'
import { AnchorTextLink } from '../../../components/TextLink'
import { find } from '../../../utils/helpers'
import { useEvmTransaction } from '../../../utils/tinlake/useEvmTransaction'
import { Domain, useActiveDomains } from '../../../utils/useLiquidityPools'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'

function getDomainStatus(domain: Domain) {
  if (!domain.isActive) {
    return 'inactive'
  }
  if (Object.values(domain.liquidityPools).every((t) => Object.values(t).every((p) => !!p))) {
    return 'deployed'
  }
  return 'deploying'
}

export function LiquidityPools() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const { data: domains, refetch } = useActiveDomains(poolId)
  const getName = useGetNetworkName()

  const titles = {
    inactive: 'Not active',
    deploying: 'Action needed',
    deployed: 'Active',
  }

  return (
    <PageSection
      title="Connected blockchains"
      subtitle="View liquidity on all blockchains that this pool is connected to, and enable investments on new blockchains."
    >
      <Accordion
        items={
          domains?.map((domain) => ({
            title: (
              <>
                {getName(domain.chainId)} <Text fontWeight={400}>- {titles[getDomainStatus(domain)]}</Text>
              </>
            ),
            body: <PoolDomain poolId={poolId} domain={domain} refetch={refetch} />,
          })) ?? []
        }
      />
    </PageSection>
  )
}

function PoolDomain({ poolId, domain, refetch }: { poolId: string; domain: Domain; refetch: () => void }) {
  const pool = usePool(poolId)
  const poolAdmin = usePoolAdmin(poolId)
  const getName = useGetNetworkName()
  const explorer = useGetExplorerUrl(domain.chainId)
  const api = useCentrifugeApi()

  const status = getDomainStatus(domain)

  const { execute, isLoading } = useCentrifugeTransaction(
    `Update token prices`,
    (cent) => (entries: [string, CurrencyKey][], options) => {
      return combineLatest(
        entries.map(([tid, curKey]) =>
          cent.liquidityPools.updateTokenPrice([poolId, tid, curKey, domain.chainId], { batch: true })
        )
      ).pipe(
        switchMap((txs) => {
          return cent.wrapSignAndSend(api, txs.length > 1 ? api.tx.utility.batchAll(txs) : txs[0], options)
        })
      )
    }
  )

  function updateTokenPrices() {
    const entries = Object.entries(domain.liquidityPools).flatMap(([tid, poolsByCurrency]) => {
      return domain.currencies
        .filter((cur) => !!poolsByCurrency[cur.address])
        .map((cur) => [tid, cur.key] satisfies [string, CurrencyKey])
    })
    execute(entries, { account: poolAdmin })
  }

  return (
    <Stack gap={1}>
      {status === 'inactive' ? (
        <EnableButton poolId={poolId} domain={domain} />
      ) : status === 'deploying' ? (
        <ConnectionGuard networks={[domain.chainId]} body="Connect to the right network to continue" variant="plain">
          {pool.tranches.map((t) => (
            <React.Fragment key={t.id}>
              {domain.undeployedTranches[t.id] && (
                <DeployTrancheButton poolId={poolId} trancheId={t.id} domain={domain} onSuccess={refetch} />
              )}
              {domain.currencies.map((currency, i) => (
                <React.Fragment key={i}>
                  {domain.trancheTokens[t.id] && !domain.liquidityPools[t.id][currency.address] && (
                    <DeployLPButton
                      poolId={poolId}
                      trancheId={t.id}
                      domain={domain}
                      currencyIndex={i}
                      onSuccess={refetch}
                    />
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </ConnectionGuard>
      ) : (
        pool.tranches.map((tranche) => (
          <AnchorTextLink href={explorer.address(domain.trancheTokens[tranche.id])}>
            <Shelf gap={1}>
              <span>
                See {tranche.currency.name} token on {getName(domain.chainId)}
              </span>
              <IconExternalLink size="iconSmall" />
            </Shelf>
          </AnchorTextLink>
        ))
      )}
      {domain.hasDeployedLp && (
        <Button onClick={updateTokenPrices} loading={isLoading} small>
          Update token prices
        </Button>
      )}
    </Stack>
  )
}

function DeployTrancheButton({
  poolId,
  trancheId,
  domain,
  onSuccess,
}: {
  poolId: string
  trancheId: string
  domain: Domain
  onSuccess: () => void
}) {
  const pool = usePool(poolId)
  const { execute, isLoading } = useEvmTransaction(`Deploy tranche`, (cent) => cent.liquidityPools.deployTranche, {
    onSuccess,
  })
  const tranche = find(pool.tranches, (t) => t.id === trancheId)!

  return (
    <Button loading={isLoading} onClick={() => execute([domain.poolManager, poolId, trancheId])} small>
      Deploy tranche: {tranche.currency.name}
    </Button>
  )
}

function DeployLPButton({
  poolId,
  trancheId,
  currencyIndex,
  domain,
  onSuccess,
}: {
  poolId: string
  trancheId: string
  domain: Domain
  currencyIndex: number
  onSuccess: () => void
}) {
  const pool = usePool(poolId)

  const { execute, isLoading } = useEvmTransaction(
    `Deploy liquidity pool`,
    (cent) => cent.liquidityPools.deployLiquidityPool,
    { onSuccess }
  )
  const tranche = find(pool.tranches, (t) => t.id === trancheId)!

  return (
    <Button
      loading={isLoading}
      onClick={() => execute([domain.poolManager, poolId, trancheId, domain.currencies[currencyIndex].address])}
      small
    >
      Deploy tranche/currency liquidity pool: {tranche.currency.name} / {domain.currencies[currencyIndex].name}
    </Button>
  )
}

function EnableButton({ poolId, domain }: { poolId: string; domain: Domain }) {
  const poolAdmin = usePoolAdmin(poolId)
  const name = useNetworkName(domain.chainId)
  const { execute, isLoading } = useCentrifugeTransaction(
    `Enable ${name}`,
    (cent) => cent.liquidityPools.enablePoolOnDomain
  )

  const currenciesToAdd = domain.currencies
    .filter((cur) => domain.currencyNeedsAdding[cur.address])
    .map((cur) => cur.key)

  return (
    <Button
      loading={isLoading}
      onClick={() => execute([poolId, domain.chainId, currenciesToAdd], { account: poolAdmin })}
      small
    >
      Enable
    </Button>
  )
}
