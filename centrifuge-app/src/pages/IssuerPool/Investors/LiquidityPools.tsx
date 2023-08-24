import { useCentrifuge, useCentrifugeTransaction, useGetNetworkName, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Text } from '@centrifuge/fabric'
import React from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router'
import { DataTable } from '../../../components/DataTable'
import { PageSection } from '../../../components/PageSection'
import { useActiveDomains, useDomainRouters } from '../../../utils/useLiquidityPools'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'

type Row = { chainId: number }

export function LiquidityPools() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const domains = useDomainRouters()
  const getName = useGetNetworkName()

  return (
    <PageSection
      title="Connected blockchains"
      subtitle="View liquidity on all blockchains that this pool is connected to, and enable investments on new blockchains."
    >
      {pool?.tranches && domains && (
        <DataTable
          data={domains}
          columns={[
            {
              align: 'left',
              header: 'Blockchain',
              cell: (row: Row) => <Text variant="body2">{getName(row.chainId)}</Text>,
              flex: '4',
            },
            {
              align: 'center',
              header: '',
              cell: (row: Row) => <EnableButton poolId={poolId} chainId={row.chainId} />,
              flex: '1',
            },
          ]}
        />
      )}
    </PageSection>
  )
}

function EnableButton({ poolId, chainId }: { poolId: string; chainId: number }) {
  const pool = usePool(poolId)
  const {
    evm: { getProvider },
  } = useWallet()
  const cent = useCentrifuge()
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

  const { data: domains } = useActiveDomains(poolId)
  const managerAddress = domains?.find((d) => d.chainId === chainId)?.managerAddress
  const { data: isEnabled, isLoading: isFetching } = useQuery(
    ['poolLps', poolId],
    async () => {
      const results = await Promise.allSettled(
        pool.tranches.map((t) =>
          cent.liquidityPools.getLiquidityPools([managerAddress!, poolId, t.id], {
            rpcProvider: getProvider(chainId),
          })
        )
      )
      return results.some((result) => result.status === 'fulfilled' && result.value.length > 0)
    },
    {
      enabled: !!managerAddress,
      staleTime: Infinity,
    }
  )
  const { execute, isLoading } = useCentrifugeTransaction(
    'Update investor',
    (cent) => cent.liquidityPools.enablePoolOnDomain
  )

  return (
    <Button
      disabled={isEnabled}
      loading={isLoading || isFetching}
      onClick={() => execute([poolId, chainId], { account })}
      small
    >
      {isEnabled ? 'Enabled' : 'Enable'}
    </Button>
  )
}
