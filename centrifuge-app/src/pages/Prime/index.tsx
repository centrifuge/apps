import { CurrencyBalance, addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { Box, Grid, IconExternalLink, IconGlobe, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import { useTheme } from 'styled-components'
import { AnchorTextLink } from '../../../src/components/TextLink'
import primePageImage from '../../assets/images/prime_page_image.svg'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { DAO, useDAOConfig } from '../../utils/useDAOConfig'
import { useFilters } from '../../utils/useFilters'
import { usePools } from '../../utils/usePools'
import { useSubquery } from '../../utils/useSubquery'

export default function PrimePage() {
  return <Prime />
}

function Prime() {
  const theme = useTheme()
  return (
    <>
      <LayoutSection alignItems="flex-start" pt={3} pb={3}>
        <Box display="flex" alignItems="center" ml={2}>
          <Box
            backgroundColor="backgroundSecondary"
            borderRadius={28}
            height={40}
            width={40}
            border={`6px solid ${theme.colors.borderTertiary}`}
            display="flex"
            justifyContent="center"
            alignItems="center"
            padding="10px"
          >
            <IconGlobe size={20} />
          </Box>
          <Text variant="heading1" style={{ marginLeft: 8 }}>
            Centrifuge Prime
          </Text>
        </Box>
        <Box borderBottom={`1px solid ${theme.colors.borderPrimary}`} pb={2} mx={2} />
        <Grid
          gridTemplateColumns={['1fr', '1fr 1fr']}
          gap={6}
          mt={2}
          padding="0px 50px"
          style={{ placeItems: 'center' }}
        >
          <Box>
            <Text variant="body1" style={{ lineHeight: '25.6px' }}>
              Centrifuge Prime was built to meet the needs of large decentralized organizations and protocols. Through
              Centrifuge Prime, DeFi native organizations can integrate with the largest financial markets in the world
              and take advantage of real yields from real economic activity - all onchain. Assets tailored to your
              needs, processes adapted to your governance, and all through decentralized rails.
            </Text>
            <Box display="flex" alignItems="center" mt={4}>
              <AnchorTextLink
                href="https://centrifuge.io/prime/"
                target="_blank"
                style={{ textDecoration: 'none', marginRight: 8 }}
              >
                Go to website
              </AnchorTextLink>
              <IconExternalLink size={20} />
            </Box>
          </Box>
          <Box>
            <Box as="img" src={primePageImage} />
          </Box>
        </Grid>
      </LayoutSection>
      <Box borderBottom={`1px solid ${theme.colors.borderPrimary}`} pb={3} />
      <DaoPortfoliosTable />
    </>
  )
}

type Row = DAO & { value?: number; profit?: number; networkName: string; firstInvestment?: Date }

function DaoPortfoliosTable() {
  const utils = useCentrifugeUtils()
  const getNetworkName = useGetNetworkName()
  const { data: daoData } = useDAOConfig()
  const pools = usePools()

  const daos =
    daoData?.map((dao) => ({
      ...dao,
      centAddress:
        typeof dao.network === 'number'
          ? utils.evmToSubstrateAddress(dao.address, dao.network)
          : addressToHex(dao.address),
    })) || []

  const { data: subData, isLoading: isSubqueryLoading } = useSubquery(
    `query ($accounts: [String!]) {
      accounts(
        filter: {id: {in: $accounts}}
      ) {
        nodes {
          id
          investorTransactions(orderBy: TIMESTAMP_ASC, first: 1) {
            nodes {
              timestamp
              tokenPrice
              tranche {
                tokenPrice
                trancheId
              }
            }
          }
          trancheBalances {
            nodes {
              claimableCurrency
              claimableTrancheTokens
              pendingInvestCurrency
              pendingRedeemTrancheTokens
              sumClaimedCurrency
              sumClaimedTrancheTokens
              trancheId
              poolId
            }
          }
          currencyBalances {
            nodes {
              amount
              currency {
                symbol
                decimals
                trancheId
              }
            }
          }
          investorPositions {
            nodes {
              holdingQuantity
              poolId
              purchasePrice
              timestamp
              trancheId
            }
          }
        }
      }
    }`,
    {
      accounts: daos.map((dao) => dao.centAddress),
    }
  )

  const mapped: Row[] = daos.map((dao, i) => {
    const account = subData?.accounts.nodes.find((n: any) => n.id === dao.centAddress)
    const investTxs = account?.investorTransactions.nodes
    const trancheBalances: Record<string, { balance: number; tokenPrice: number }> = {}

    account?.investorPositions.nodes.forEach((position: any) => {
      const pool = pools?.find((p) => p.id === position.poolId)
      const trancheId = position.trancheId.split('-')[1]
      const decimals = pool?.currency.decimals ?? 18
      const tokenPrice = pool?.tranches.find((t) => trancheId === t.id)?.tokenPrice?.toFloat() ?? 1
      const balance = new CurrencyBalance(position.holdingQuantity, decimals).toFloat()
      const existing = trancheBalances[trancheId]
      if (existing) {
        existing.balance += balance
      } else {
        trancheBalances[trancheId] = { balance, tokenPrice }
      }
    })
    const totalValue = Object.values(trancheBalances)?.reduce(
      (acc, { balance, tokenPrice }) => acc + balance * tokenPrice,
      0
    )

    return {
      ...dao,
      value: totalValue ?? 0,
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
      width: '2fr',
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
      cell: (row: Row) => <Text>{getNetworkName(row.network)}</Text>,
      width: '2fr',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Portfolio value" />,
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={isSubqueryLoading}>
          {row.value != null && formatBalance(row.value, 'USD')}
        </TextWithPlaceholder>
      ),
      sortKey: 'value',
      width: '2fr',
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
    <Box mt={2}>
      <Text variant="heading4" style={{ marginBottom: 12 }}>
        Portfolios
      </Text>
      <DataTable
        columns={columns}
        data={filters.data}
        defaultSortKey="value"
        defaultSortOrder="desc"
        onRowClicked={(row: Row) => `/prime/${row.slug}`}
      />
    </Box>
  )
}
