import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  Grid,
  IconChevronRight,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
} from '@centrifuge/fabric'
import { useMemo, useState } from 'react'
import { PageSummary } from '../../../../src/components/PageSummary'
import { Tooltips } from '../../../../src/components/Tooltips'
import { StyledRouterTextLink } from '../../../../src/pages/Pool/Assets'
import { Dec } from '../../../../src/utils/Decimal'
import { formatBalance } from '../../../../src/utils/formatting'
import { useSuitableAccounts } from '../../../../src/utils/usePermissions'
import { useInvestorList } from '../../../../src/utils/usePools'

export default function OnchainSection({ pool }: { pool: Pool }) {
  const investors = useInvestorList(pool?.id ?? '')
  const [account] = useSuitableAccounts({ poolId: pool?.id ?? '', poolRole: ['LiquidityAdmin'] })
  const [selectedTabIndexInvestments, setSelectedTabIndexInvestments] = useState(0)
  const [selectedTabIndexRedemptions, setSelectedTabIndexRedemptions] = useState(0)
  const [editMaxReserve, setEditMaxReserve] = useState(false)
  const [maxReserve, setMaxReserve] = useState(pool?.reserve.max.toDecimal().toNumber())
  const [error, setError] = useState<string | undefined>(undefined)
  const canEditMaxReserve = !!account

  const { execute: setMaxReserveTx, isLoading } = useCentrifugeTransaction(
    'Set max reserve',
    (cent) => cent.pools.setMaxReserve,
    {
      onSuccess: () => {
        setEditMaxReserve(false)
        setError(undefined)
      },
    }
  )

  const { execute: closeEpochTx, isLoading: isClosingEpoch } = useCentrifugeTransaction(
    'Close epoch',
    (cent) => cent.pools.closeEpoch
  )

  const onClick = () => {
    if (editMaxReserve) {
      if (typeof maxReserve === 'number' && maxReserve >= 0) {
        setMaxReserveTx([pool?.id, CurrencyBalance.fromFloat(maxReserve, pool?.currency.decimals)], { account })
      } else {
        setError('Invalid number')
      }
    } else {
      setEditMaxReserve(true)
    }
  }

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: <Tooltips label="Pool reserve" type="poolReserve" />,
      value: <Text variant="heading1">{formatBalance(pool?.reserve.available || 0)}</Text>,
      heading: false,
    },
    {
      label: <Tooltips label="Max reserve" type="maxReserve" />,
      value: editMaxReserve ? (
        <CurrencyInput
          value={maxReserve}
          currency={pool?.currency.symbol}
          onChange={(value) => setMaxReserve(value || 0)}
          errorMessage={error}
        />
      ) : (
        <Text variant="heading1">{formatBalance(pool?.reserve.max || 0)}</Text>
      ),
      heading: false,
    },
  ]

  const pendingInvestments = useMemo(() => {
    if (!pool || !pool.tranches || !investors) {
      return { 0: Dec(0), 1: Dec(0) }
    }

    return investors.reduce(
      (acc, investor) => {
        const tranche = pool.tranches.find((t) => t.id === investor.trancheId)
        if (tranche) {
          const key = tranche.seniority === 0 ? 0 : 1
          acc[key] = acc[key].add(investor.pendingInvestCurrency.toDecimal())
        }
        return acc
      },
      { 0: Dec(0), 1: Dec(0) }
    )
  }, [pool, investors])

  const pendingRedemptions = useMemo(() => {
    if (!pool || !pool.tranches || !investors) {
      return { 0: Dec(0), 1: Dec(0) }
    }

    return investors.reduce(
      (acc, investor) => {
        const tranche = pool.tranches.find((t) => t.id === investor.trancheId)
        if (tranche) {
          const key = tranche.seniority === 0 ? 0 : 1
          acc[key] = acc[key].add(investor.pendingRedeemTrancheTokens.toDecimal())
        }
        return acc
      },
      { 0: Dec(0), 1: Dec(0) }
    )
  }, [pool, investors])

  const redemptions = pendingRedemptions[selectedTabIndexRedemptions as keyof typeof pendingRedemptions]
  const investments = pendingInvestments[selectedTabIndexInvestments as keyof typeof pendingInvestments]

  return (
    <Box backgroundColor="backgroundSecondary" borderRadius={8} p={2} mt={3}>
      <Box display="flex" justifyContent="space-between">
        <Text variant="heading1">Onchain reserve</Text>
        <StyledRouterTextLink to={`/pools/${pool?.id}/assets/0`}>
          <Text variant="heading1">{formatBalance(pool?.reserve.total || 0)} USDC</Text>
          <IconChevronRight />
        </StyledRouterTextLink>
      </Box>
      <PageSummary
        data={pageSummaryData}
        style={{ marginLeft: 0, marginRight: 0, backgroundColor: 'white' }}
        children={
          <Grid gridTemplateColumns={editMaxReserve ? ['1fr 1fr'] : ['1fr']} gap={2}>
            <Button
              variant="secondary"
              small
              onClick={onClick}
              disabled={
                isLoading ||
                !canEditMaxReserve ||
                (maxReserve.toString() === pool?.reserve.max.toDecimal().toNumber().toString() && editMaxReserve)
              }
            >
              {editMaxReserve ? 'Update' : 'Set max reserve'}
            </Button>
            {editMaxReserve && (
              <Button variant="inverted" small onClick={() => setEditMaxReserve(false)}>
                Cancel
              </Button>
            )}
          </Grid>
        }
      />
      <Stack gap={2} mt={3}>
        <Grid gridTemplateColumns={['1fr 1fr']} gap={2}>
          <Stack backgroundColor="backgroundPage" borderRadius={8} p={2} border="1px solid" borderColor="borderPrimary">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text variant="heading4">Pending investments</Text>
              {pool.tranches.length > 1 && (
                <Tabs
                  selectedIndex={selectedTabIndexInvestments}
                  onChange={(index) => setSelectedTabIndexInvestments(index)}
                >
                  {pool.tranches.map((tranche) => (
                    <TabsItem showBorder styleOverrides={{ padding: '8px' }}>
                      {tranche.seniority === 0 ? 'Junior tranche' : 'Senior tranche'}
                    </TabsItem>
                  ))}
                </Tabs>
              )}
            </Box>
            <Text
              variant={investments.isZero() ? 'body2' : 'heading1'}
              color={investments.isZero() ? 'textSecondary' : 'textPrimary'}
              style={{ marginTop: investments.isZero() ? '12px' : 0 }}
            >
              {investments.isZero() ? 'No pending investments' : formatBalance(investments)}
            </Text>
          </Stack>
          <Stack backgroundColor="backgroundPage" borderRadius={8} p={2} border="1px solid" borderColor="borderPrimary">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text variant="heading4">Pending Redemptions</Text>
              {pool.tranches.length > 1 && (
                <Tabs
                  selectedIndex={selectedTabIndexRedemptions}
                  onChange={(index) => setSelectedTabIndexRedemptions(index)}
                >
                  {pool.tranches.map((tranche) => (
                    <TabsItem showBorder styleOverrides={{ padding: '8px' }}>
                      {tranche.seniority === 0 ? 'Junior tranche' : 'Senior tranche'}
                    </TabsItem>
                  ))}
                </Tabs>
              )}
            </Box>
            <Text
              variant={redemptions.isZero() ? 'body2' : 'heading1'}
              color={redemptions.isZero() ? 'textSecondary' : 'textPrimary'}
              style={{ marginTop: redemptions.isZero() ? '12px' : 0 }}
            >
              {redemptions.isZero() ? 'No pending redemptions' : formatBalance(redemptions)}
            </Text>
          </Stack>
        </Grid>
        <Shelf justifyContent="flex-end">
          <Button
            variant="secondary"
            small
            onClick={() => closeEpochTx([pool?.id, false], { account, forceProxyType: ['Borrow', 'Invest'] })}
            disabled={isClosingEpoch}
          >
            Close epoch
          </Button>
        </Shelf>
      </Stack>
    </Box>
  )
}
