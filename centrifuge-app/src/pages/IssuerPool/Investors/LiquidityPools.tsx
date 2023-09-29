import { useCentrifugeTransaction, useGetNetworkName, useNetworkName } from '@centrifuge/centrifuge-react'
import { Accordion, Button, Stack } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { PageSection } from '../../../components/PageSection'
import { useEvmTransaction } from '../../../utils/tinlake/useEvmTransaction'
import { Domain, useActiveDomains } from '../../../utils/useLiquidityPools'
import { useSuitableAccounts } from '../../../utils/usePermissions'
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
  const { data: domains } = useActiveDomains(poolId)
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
                {getName(domain.chainId)} {titles[getDomainStatus(domain)]}
              </>
            ),
            body: <PoolDomain poolId={poolId} domain={domain} />,
          })) ?? []
        }
      />
    </PageSection>
  )
}

function PoolDomain({ poolId, domain }: { poolId: string; domain: Domain }) {
  const pool = usePool(poolId)

  return (
    <Stack>
      <EnableButton poolId={poolId} domain={domain} />
      {pool.tranches.map((t) => (
        <>
          {domain.undeployedTranches[t.id] && <DeployTrancheButton poolId={poolId} trancheId={t.id} domain={domain} />}
          {domain.currencies.map((currency, i) => (
            <>
              {domain.trancheTokenExists[t.id] && !domain.liquidityPools[t.id][currency.address] && (
                <DeployLPButton poolId={poolId} trancheId={t.id} domain={domain} currencyIndex={i} />
              )}
            </>
          ))}
        </>
      ))}
    </Stack>
  )
}

function DeployTrancheButton({ poolId, trancheId, domain }: { poolId: string; trancheId: string; domain: Domain }) {
  const pool = usePool(poolId)

  const { execute, isLoading } = useEvmTransaction(`Deploy tranche`, (cent) => cent.liquidityPools.deployTranche)
  const tranche = pool.tranches.find((t) => t.id === trancheId)!

  return (
    <Button loading={isLoading} onClick={() => execute([domain.managerAddress, poolId, trancheId])} small>
      Deploy tranche: {tranche.currency.name}
    </Button>
  )
}

function DeployLPButton({
  poolId,
  trancheId,
  currencyIndex,
  domain,
}: {
  poolId: string
  trancheId: string
  domain: Domain
  currencyIndex: number
}) {
  const pool = usePool(poolId)

  const { execute, isLoading } = useEvmTransaction(
    `Deploy liquidity pool`,
    (cent) => cent.liquidityPools.deployLiquidityPool
  )
  const tranche = pool.tranches.find((t) => t.id === trancheId)!

  return (
    <Button
      loading={isLoading}
      onClick={() => execute([domain.managerAddress, poolId, trancheId, domain.currencies[currencyIndex].address])}
      small
    >
      Deploy tranche/currency liquidity pool: {tranche.currency.name} / {domain.currencies[currencyIndex].name}
    </Button>
  )
}

function EnableButton({ poolId, domain }: { poolId: string; domain: Domain }) {
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })
  const name = useNetworkName(domain.chainId)
  const { execute, isLoading } = useCentrifugeTransaction(
    `Enable ${name}`,
    (cent) => cent.liquidityPools.enablePoolOnDomain
  )

  return (
    <Button loading={isLoading} onClick={() => execute([poolId, domain.chainId], { account })} small>
      Enable
    </Button>
  )
}
