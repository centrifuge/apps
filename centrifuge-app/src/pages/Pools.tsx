import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { IconChevronRight, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { DataTable } from '../components/DataTable'
import { MenuSwitch } from '../components/MenuSwitch'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { TextWithPlaceholder } from '../components/TextWithPlaceholder'
import { Tooltips } from '../components/Tooltips'
import { config } from '../config'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useMetadataMulti } from '../utils/useMetadata'
import { usePools } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const pools = usePools()

  const poolMetas = useMetadataMulti<PoolMetadata>(pools?.map((p) => p.metadata) ?? [])

  const [listedPools, listedTokens] = React.useMemo(
    () => {
      const listedPools = pools?.filter((_, i) => poolMetas[i]?.data?.pool?.listed)
      const listedTokens = listedPools?.flatMap((p) => p.tranches)

      return [listedPools, listedTokens]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    poolMetas.map((q) => q.data)
  )

  const totalValueLocked = React.useMemo(() => {
    return (
      listedTokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [listedTokens])

  const pageSummaryData = [
    {
      label: <Tooltips type="tvl" />,
      value: formatBalance(Dec(totalValueLocked || 0), config.baseCurrency),
    },
    { label: 'Pools', value: listedPools?.length || 0 },
    { label: <Tooltips type="tokens" />, value: listedTokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1}>
      <PageHeader
        title="Investments"
        subtitle={`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
        actions={<MenuSwitch />}
      />
      {listedPools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolList pools={listedPools} />
        </>
      ) : pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <DataTable
            rounded={false}
            data={[{}]}
            columns={[
              {
                align: 'left',
                header: 'Pool',
                cell: () => <TextWithPlaceholder isLoading width={14} />,
                flex: '2 1 250px',
              },
              {
                align: 'left',
                header: 'Asset class',
                cell: () => <TextWithPlaceholder isLoading />,
              },
              {
                header: 'Value',
                cell: () => <TextWithPlaceholder isLoading />,
              },
              {
                header: '',
                cell: () => <IconChevronRight size={24} color="textPrimary" />,
                flex: '0 0 72px',
              },
            ]}
          />
        </>
      ) : (
        <Shelf p={4} justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no pools yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
