import { CurrencyKey } from '@centrifuge/centrifuge-js'
import {
  ConnectionGuard,
  useCentrifugeApi,
  useCentrifugeTransaction,
  useGetExplorerUrl,
  useGetNetworkIcon,
  useGetNetworkName,
  useNetworkName,
} from '@centrifuge/centrifuge-react'
import {
  Accordion,
  Box,
  Button,
  Grid,
  IconExternalLink,
  InlineFeedback,
  Shelf,
  Spinner,
  Stack,
  Text,
} from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { combineLatest, switchMap } from 'rxjs'
import { PageSection } from '../../../components/PageSection'
import { find } from '../../../utils/helpers'
import { useEvmTransaction } from '../../../utils/tinlake/useEvmTransaction'
import { Domain, useActiveDomains } from '../../../utils/useLiquidityPools'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'

function getDomainStatus(domain: Domain) {
  if (!domain.isActive) {
    return 'inactive'
  }
  if (domain.hasDeployedLp) {
    return 'deployed'
  }
  return 'deploying'
}

export function LiquidityPools() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const { data: domains, refetch } = useActiveDomains(poolId)
  const getName = useGetNetworkName()
  const getIcon = useGetNetworkIcon()

  return (
    <PageSection
      title="Connected blockchains"
      subtitle="View liquidity on all blockchains that this pool is connected to, and enable investments on new blockchains."
    >
      <Grid height="fit-content" gridTemplateColumns={['1fr 1fr 1fr 1fr']} gap={[2, 2]}>
        {domains ? (
          domains.map((domain) => (
            <Accordion
              items={[
                {
                  title: (
                    <Shelf gap="12px">
                      <Box
                        as="img"
                        src={getIcon(domain.chainId)}
                        alt=""
                        width="iconSmall"
                        height="iconSmall"
                        style={{ objectFit: 'contain' }}
                        bleedY="12px"
                      />
                      <Text>
                        {getName(domain.chainId)}{' '}
                        {getDomainStatus(domain) === 'deploying' && <Text fontWeight={400}>- Action needed</Text>}
                      </Text>
                    </Shelf>
                  ),
                  body: <PoolDomain poolId={poolId} domain={domain} refetch={refetch} />,
                },
              ]}
            />
          ))
        ) : (
          <Spinner />
        )}
      </Grid>
    </PageSection>
  )
}

function PoolDomain({ poolId, domain, refetch }: { poolId: string; domain: Domain; refetch: () => void }) {
  const pool = usePool(poolId)
  const poolAdmin = usePoolAdmin(poolId)
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
          return cent.wrapSignAndSend(
            api,
            txs.length > 1
              ? api.tx.utility.batchAll([
                  api.tx.liquidityPoolsGateway.startBatchMessage({ EVM: domain.chainId }),
                  ...txs,
                  api.tx.liquidityPoolsGateway.endBatchMessage({ EVM: domain.chainId }),
                ])
              : txs[0],
            options
          )
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
      {domain.hasDeployedLp && (
        <Button onClick={updateTokenPrices} variant="primary" loading={isLoading} small>
          Update token prices
        </Button>
      )}

      {domain.currencies.length === 0 && (
        <Box bg={'statusCriticalBg'} p={1}>
          <InlineFeedback status="critical">
            <Text color={'statusCritical'}>There is no assets setup yet for this chain.</Text>
          </InlineFeedback>
        </Box>
      )}
      {domain.currencies.length > 0 &&
        (status === 'inactive' ? (
          <EnableButton poolId={poolId} domain={domain} />
        ) : (
          <ConnectionGuard networks={[domain.chainId]} body="Connect to the right network to continue" variant="plain">
            {pool.tranches.map((t) => (
              <React.Fragment key={t.id}>
                {domain.canTrancheBeDeployed[t.id] && (
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
                {domain.trancheTokens[t.id] && (
                  <a href={explorer.address(domain.trancheTokens[t.id]!)} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" small style={{ width: '100%' }}>
                      <Shelf gap={1}>
                        <span>View {t.currency.symbol} token</span>
                        <IconExternalLink size="iconSmall" />
                      </Shelf>
                    </Button>
                  </a>
                )}
              </React.Fragment>
            ))}
          </ConnectionGuard>
        ))}
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
  const { execute, isLoading } = useEvmTransaction(`Deploy token`, (cent) => cent.liquidityPools.deployTranche, {
    onSuccess,
  })
  const tranche = find(pool.tranches, (t) => t.id === trancheId)!

  return (
    <Button loading={isLoading} onClick={() => execute([domain.poolManager, poolId, trancheId])} small>
      Deploy {tranche.currency.symbol} token
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

  const { execute, isLoading } = useEvmTransaction(`Deploy vault`, (cent) => cent.liquidityPools.deployLiquidityPool, {
    onSuccess,
  })
  const tranche = find(pool.tranches, (t) => t.id === trancheId)!

  return (
    <Button
      loading={isLoading}
      onClick={() => execute([domain.poolManager, poolId, trancheId, domain.currencies[currencyIndex].address])}
      small
    >
      Deploy {tranche.currency.symbol} / {domain.currencies[currencyIndex].symbol} vault
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

  const tokenPricesToUpdate = Object.entries(domain.liquidityPools).flatMap(([tid, poolsByCurrency]) => {
    return domain.currencies.map((cur) => [tid, cur.key] satisfies [string, CurrencyKey])
  })

  const currenciesToAdd = domain.currencies
    .filter((cur) => domain.currencyNeedsAdding[cur.address])
    .map((cur) => cur.key)

  return (
    <Button
      loading={isLoading}
      onClick={() =>
        execute([poolId, domain.chainId, currenciesToAdd, tokenPricesToUpdate, domain.chainId], {
          account: poolAdmin,
        })
      }
      small
    >
      Enable
    </Button>
  )
}
