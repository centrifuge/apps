import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'
import { useDailyPoolStates, useInvestorTransactions, usePool } from '../../utils/usePools'

import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Box, Divider, IconClockForward, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
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
  const pool = usePool(poolId)
  const investorTransactions = useInvestorTransactions(poolId)
  const investments =
    pool &&
    investorTransactions
      ?.filter((t) => t.type === 'INVEST_COLLECT')
      .reduce((acc, tx) => (tx.currencyAmount ? acc.add(tx.currencyAmount) : new BN(0)), new BN(0))

  const redemptions =
    pool &&
    investorTransactions
      ?.filter((t) => t.type === 'REDEEM_COLLECT')
      .reduce((acc, tx) => (tx.currencyAmount ? acc.add(tx.currencyAmount) : new BN(0)), new BN(0))

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

export const NavOverviewCard = ({ poolId }: { poolId: string }) => {
  const pool = usePool(poolId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { poolStates: dailyPoolStates } = useDailyPoolStates(poolId, new Date(pool.nav.lastUpdated), today) || {}

  const pendingFees = new CurrencyBalance(
    pool?.poolFees?.map((f) => f.amounts.pending).reduce((acc, f) => acc.add(f), new BN(0)) ?? new BN(0),
    pool.currency.decimals
  )
  const changeInValuation = dailyPoolStates?.length
    ? new BN(dailyPoolStates[0]?.sumBorrowedAmountByPeriod ?? 0).add(
        new BN(dailyPoolStates.reverse()[0]?.sumBorrowedAmountByPeriod ?? new BN(0))
      )
    : new BN(0)

  const pendingNav =
    dailyPoolStates && dailyPoolStates?.length
      ? new BN(dailyPoolStates.reverse()[0].portfolioValuation).add(pool.reserve.total)
      : new BN(0)
  return (
    <Box>
      <Stack
        m="22px"
        p="16px"
        borderRadius="6px"
        maxWidth="444px"
        style={{ background: 'linear-gradient(0deg, #FEFEFE 0%, #FAFAFA 100%)' }}
      >
        <Shelf justifyContent="space-between" my={2}>
          <Text variant="body2" color="textPrimary">
            Current NAV
          </Text>
          <Text variant="body2">{formatBalance(pool?.nav.total, pool.currency.displayName, 2)}</Text>
        </Shelf>
        <Divider borderColor="statusInfoBg" />
        <Shelf justifyContent="space-between" mt={2} mb={1}>
          <Text variant="body2" color="textPrimary">
            Change in asset valuation
          </Text>
          <Text variant="body2" color="statusOk">
            {formatBalance(
              changeInValuation ? new CurrencyBalance(changeInValuation, pool.currency.decimals) : 0,
              pool.currency.displayName,
              2
            )}
          </Text>
        </Shelf>
        <Shelf justifyContent="space-between" mb={2}>
          <Text variant="body2" color="textPrimary">
            Pending fees
          </Text>
          <Text variant="body2" color="statusCritical">
            -{formatBalance(pendingFees, pool.currency.displayName, 2)}
          </Text>
        </Shelf>
        <Divider borderColor="statusInfoBg" />
        <Shelf justifyContent="space-between" my={2}>
          <Shelf gap={1}>
            <IconClockForward color="textSelected" size="iconSmall" />
            <Text variant="body2" color="textSelected">
              Pending NAV
            </Text>
          </Shelf>
          <Text variant="body2" color="textSelected">
            {formatBalance(new CurrencyBalance(pendingNav, pool.currency.decimals), pool.currency.displayName, 2)}
          </Text>
        </Shelf>
      </Stack>
    </Box>
  )
}
