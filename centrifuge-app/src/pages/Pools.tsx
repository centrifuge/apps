import { Perquintill } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text, Toggle } from '@centrifuge/fabric'
import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { Tooltips } from '../components/Tooltips'
import { config } from '../config'
import { Dec } from '../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { usePools, useTokens } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const pools = usePools()
  const dataTokens = useTokens()

  const tokens = React.useMemo(
    () =>
      dataTokens
        ?.map((tranche) => {
          return {
            ...tranche,
            poolId: tranche.poolId,
            poolMetadata: tranche.poolMetadata,
            // feeToApr is a temporary solution for calculating yield
            // bc we don't have a way to query for historical token prices yet
            // Use this formula when prices can be fetched: https://docs.centrifuge.io/learn/terms/#30d-drop-yield
            yield: tranche.interestRatePerSec ? tranche.interestRatePerSec.toAprPercent().toNumber() : null,
            protection: tranche.minRiskBuffer?.toPercent().toNumber() || new Perquintill(0).toPercent().toNumber(),
            valueLocked: tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal()).toNumber(),
          }
        })
        .flat() || [],
    [dataTokens]
  )

  const totalValueLocked = React.useMemo(
    () => tokens?.reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0),
    [tokens]
  )

  const pageSummaryData = [
    {
      label: <Tooltips type="tvl" />,
      value: formatBalance(Dec(totalValueLocked || 0), getCurrencySymbol(config.baseCurrency)),
    },
    { label: <Tooltips type="tokens" />, value: tokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1}>
      <PageHeader
        title="Investments"
        subtitle="Pools and tokens of real-world assets"
        actions={
          <Toggle active="pools">
            <NavLink to="/pools">Pools</NavLink>
            <NavLink to="/tokens">Tokens</NavLink>
          </Toggle>
        }
      />
      {pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolList pools={pools} />
        </>
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no pools yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
