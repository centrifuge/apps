import { Price } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeUtils, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, IconExternalLink, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { LayoutBase } from '../../components/LayoutBase'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { DAO, useGetDAOConfig } from '../../utils/useDAOConfig'
import { useFilters } from '../../utils/useFilters'
import { useSubquery } from '../../utils/useSubquery'

export default function PrimePage() {
  return (
    <LayoutBase>
      <Prime />
    </LayoutBase>
  )
}

function Prime() {
  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" alignItems="flex-start" pt={5}>
        <Text variant="heading1">Centrifuge Prime</Text>
        <Box maxWidth={800}>
          <Text variant="body1">
            Centrifuge Prime was built to meet the needs of large decentralized organizations and protocols. Through
            Centrifuge Prime, DeFi native organizations can integrate with the largest financial markets in the world
            and take advantage of real yields from real economic activity - all onchain. Assets tailored to your needs,
            processes adapted to your governance, and all through decentralized rails.
          </Text>
        </Box>
        <Box bleedX={2} bleedY={1}>
          <AnchorButton
            href="https://centrifuge.io/prime/"
            target="_blank"
            iconRight={IconExternalLink}
            variant="tertiary"
          >
            Go to website
          </AnchorButton>
        </Box>
      </LayoutSection>
      <DaoPortfoliosTable />
    </>
  )
}

type Row = DAO & { value?: number; profit?: number; networkName: string; firstInvestment?: Date }

function DaoPortfoliosTable() {
  const utils = useCentrifugeUtils()
  const cent = useCentrifuge()
  const getNetworkName = useGetNetworkName()
  const { data: daoData } = useGetDAOConfig()

  const daos =
    daoData?.map((dao) => ({
      ...dao,
      address: utils.formatAddress(
        typeof dao.network === 'number' ? utils.evmToSubstrateAddress(dao.address, dao.network) : dao.address
      ),
    })) || []

  // TODO: Update to use new portfolio Runtime API
  const { data, isLoading: isPortfoliosLoading } = useQuery(['daoPortfolios', daos.map((dao) => dao.address)], () =>
    Promise.all(daos.map((dao) => firstValueFrom(cent.pools.getBalances([dao.address]))))
  )

  const { data: subData, isLoading: isSubqueryLoading } = useSubquery(
    `query ($accounts: [String!]) {
      accounts(
        filter: {id: {in: $accounts}}
      ) {
        nodes {
          id
          investorTransactions {
            nodes {
              timestamp
              tokenPrice
              tranche {
                tokenPrice
                trancheId
              }
            }
          }
        }
      }
    }`,
    {
      accounts: daos.map((dao) => dao.address),
    }
  )

  const mapped: Row[] = daos.map((dao, i) => {
    const investTxs = subData?.accounts.nodes.find((n: any) => n.id === dao.address)?.investorTransactions.nodes
    const trancheBalances =
      data?.[i].tranches && Object.fromEntries(data[i].tranches.map((t) => [t.trancheId, t.balance.toFloat()]))
    const yields =
      trancheBalances &&
      Object.keys(trancheBalances).map((tid) => {
        const firstTx = investTxs?.find((tx: any) => tx.tranche.trancheId === tid)
        const initialTokenPrice = firstTx && new Price(firstTx.tokenPrice).toFloat()
        const tokenPrice = firstTx && new Price(firstTx.tranche.tokenPrice).toFloat()
        const profit = tokenPrice / initialTokenPrice - 1
        return [tid, profit] as const
      })
    const totalValue = trancheBalances && Object.values(trancheBalances)?.reduce((acc, balance) => acc + balance, 0)
    const weightedYield =
      yields &&
      totalValue &&
      yields.reduce((acc, [tid, profit]) => acc + profit * trancheBalances![tid], 0) / totalValue

    return {
      ...dao,
      value: totalValue ?? 0,
      profit: weightedYield ? weightedYield * 100 : 0,
      networkName: getNetworkName(dao.network),
      firstInvestment: investTxs?.[0] && new Date(investTxs[0].timestamp),
    }
  })

  const uniqueNetworks = [...new Set(daos.map((dao) => dao.network))]
  const filters = useFilters({ data: mapped })

  const columns: Column[] = [
    {
      align: 'left',
      header: 'DAO',
      cell: (row: Row) => (
        <Shelf gap={1}>
          <Box as="img" src={row.logo} alt={row.name} width="iconSmall" height="iconSmall" borderRadius="50%" />
          <Text>{row.name}</Text>
        </Shelf>
      ),
    },
    {
      align: 'left',
      header: (
        <FilterableTableHeader
          filterKey="network"
          filters={filters}
          label="Network"
          options={Object.fromEntries(uniqueNetworks.map((chain) => [chain, getNetworkName(chain)]))}
        />
      ),
      cell: (row: Row) => <Text>{row.networkName}</Text>,
    },
    {
      header: <SortableTableHeader label="Portfolio value" />,
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={isPortfoliosLoading}>
          {row.value != null && formatBalance(row.value, 'USD')}
        </TextWithPlaceholder>
      ),
      sortKey: 'value',
    },
    {
      header: <SortableTableHeader label="Profit" />,
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={isPortfoliosLoading || isSubqueryLoading}>
          {row.profit != null && formatPercentage(row.profit)}
        </TextWithPlaceholder>
      ),
      sortKey: 'profit',
    },
    {
      align: 'left',
      header: 'First investment',
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={isSubqueryLoading}>
          {row.firstInvestment ? formatDate(row.firstInvestment) : '-'}
        </TextWithPlaceholder>
      ),
      width: '5fr',
    },
  ]

  return (
    <LayoutSection title="DAO portfolios">
      <DataTable
        columns={columns}
        data={filters.data}
        defaultSortKey="value"
        defaultSortOrder="desc"
        onRowClicked={(row: Row) => `/prime/${row.slug}`}
      />
    </LayoutSection>
  )
}
