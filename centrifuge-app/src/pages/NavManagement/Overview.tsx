import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'
import { useInvestorTransactions, usePool, usePools } from '../../utils/usePools'

import { CurrencyBalance, addressToHex } from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifugeApi, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { Box, Divider, IconClockForward, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { map } from 'rxjs'
import { isSubstrateAddress } from '../../utils/address'
import { NavManagementAssetTable } from './NavManagementAssetTable'
import { NavManagementHeader } from './NavManagementHeader'

export default function NavManagementOverviewPage() {
  const { pid } = useParams<{ pid: string }>()
  return (
    <LayoutBase>
      <NavManagementHeader />
      <NavManagementPageSummary poolId={pid} />
      <NavOverviewCard poolId={pid} />
      <NavManagementAssetTable key={pid} poolId={pid} />
    </LayoutBase>
  )
}

export const NavManagementPageSummary = ({ poolId }: { poolId: string }) => {
  const pool = usePool(poolId, false)
  const investorTransactions = useInvestorTransactions(poolId)
  const investments =
    pool &&
    investorTransactions
      ?.filter((t) => t.type === 'INVEST_COLLECT')
      .reduce((acc, tx) => (tx.currencyAmount ? acc.add(tx.currencyAmount) : new BN(0)), new BN(0))

  return (
    <PageSummary
      data={[
        {
          label: <Tooltips type="totalNav" />,
          value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol),
        },
        {
          label: 'Investments',
          value: formatBalance(
            new CurrencyBalance(investments ?? 0, pool?.currency.decimals || 18),
            pool?.currency.symbol,
            2
          ),
        },
        {
          label: 'Redemptions',
          value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol),
        },
      ]}
    />
  )
}

function usePoolFeeders() {
  const api = useCentrifugeApi()
  const [storedInfo] = useCentrifugeQuery(['oracleCollectionInfos'], () =>
    api.query.oraclePriceCollection.collectionInfo.entries().pipe(
      map((data) => {
        const poolsByFeeder: Record<string, string[]> = {}
        const feedersByPool: Record<string, { minFeeders: number; valueLifetime: number; feeders: string[] }> = {}
        data.forEach(([keys, value]) => {
          const poolId = (keys.toHuman() as string[])[0].replace(/\D/g, '')
          const info = value.toPrimitive() as any
          const feeders = info.feeders
            .filter((f: any) => !!f.system.signed)
            .map((f: any) => addressToHex(f.system.signed)) as string[]

          feeders.forEach((feeder) => {
            if (poolsByFeeder[feeder]) {
              poolsByFeeder[feeder].push(poolId)
            } else {
              poolsByFeeder[feeder] = [poolId]
            }
          })

          feedersByPool[poolId] = {
            valueLifetime: info.valueLifetime as number,
            minFeeders: info.minFeeders as number,
            feeders,
          }
        })

        return {
          poolsByFeeder,
          feedersByPool,
        }
      })
    )
  )

  return {
    poolsByFeeder: storedInfo?.poolsByFeeder ?? {},
    feedersByPool: storedInfo?.feedersByPool ?? {},
  }
}

export function usePoolsForWhichAccountIsFeeder(address?: string) {
  const defaultAddress = useAddress('substrate')
  address ??= defaultAddress
  const { poolsByFeeder } = usePoolFeeders()
  const poolIds = (address && isSubstrateAddress(address) && poolsByFeeder[address]) || []
  return usePools()?.filter((p) => poolIds.includes(p.id))
}

export const NavOverviewCard = ({ poolId }: { poolId: string }) => {
  const pool = usePool(poolId)
  const pendingFees = new CurrencyBalance(
    pool?.poolFees?.map((f) => f.amounts.pending).reduce((acc, f) => acc.add(f), new BN(0)) ?? 0,
    pool.currency.decimals
  )
  return (
    <Box>
      <Stack
        m="22px"
        p="16px"
        borderRadius="6px"
        maxWidth="444px"
        style={{ background: 'linear-gradient(0deg, #FEFEFE 0%, #FAFAFA 100%)' }}
        gap={1}
      >
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Current NAV
          </Text>
          <Text variant="body2">{formatBalance(pool?.nav.total, pool.currency.displayName)}</Text>
        </Shelf>
        <Divider borderColor="statusInfoBg" />
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Change in asset valuation
          </Text>
          <Text variant="body2" color="statusOk">
            {formatBalance(pool?.nav.total, pool.currency.displayName)}
          </Text>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Pending fees
          </Text>
          <Text variant="body2" color="statusCritical">
            -{formatBalance(pendingFees, pool.currency.displayName)}
          </Text>
        </Shelf>
        <Divider borderColor="statusInfoBg" />
        <Shelf justifyContent="space-between">
          <Shelf gap={1}>
            <IconClockForward color="textSelected" size="iconSmall" />
            <Text variant="body2" color="textSelected">
              Pending NAV
            </Text>
          </Shelf>
          <Text variant="body2" color="textSelected">
            {formatBalance(pool?.nav.total, pool.currency.displayName)}
          </Text>
        </Shelf>
      </Stack>
    </Box>
  )
}
