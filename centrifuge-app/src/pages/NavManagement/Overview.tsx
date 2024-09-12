import { useParams } from 'react-router'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'

import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { NavManagementAssetTable } from './NavManagementAssetTable'

export default function NavManagementOverviewPage() {
  const { pid } = useParams<{ pid: string }>()
  if (!pid) throw new Error('Pool not found')
  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" pt={5} pb={3}>
        <Stack as="header" gap={1} ml={1}>
          <Text as="h1" variant="heading1">
            NAV Management
          </Text>
        </Stack>
      </LayoutSection>
      <NavManagementPageSummary poolId={pid} />
      <NavManagementAssetTable key={pid} poolId={pid} />
    </>
  )
}

export function NavManagementPageSummary({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dailyPoolStates = useDailyPoolStates(poolId, new Date(pool.createdAt || today), today)
  const investments =
    pool &&
    dailyPoolStates?.poolStates?.reduce(
      (acc, state) =>
        state && state?.sumInvestedAmountByPeriod ? acc.add(new BN(state.sumInvestedAmountByPeriod)) : new BN(0),
      new BN(0)
    )

  const redemptions =
    pool &&
    dailyPoolStates?.poolStates?.reduce(
      (acc, state) =>
        state && state?.sumRedeemedAmountByPeriod ? acc.add(new BN(state.sumRedeemedAmountByPeriod)) : new BN(0),
      new BN(0)
    )

  return (
    <PageSummary
      data={[
        {
          label: <Tooltips type="totalNav" />,
          value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol, 2),
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
          value: formatBalance(new CurrencyBalance(redemptions ?? 0, pool.currency.decimals), pool?.currency.symbol, 2),
        },
      ]}
    />
  )
}
