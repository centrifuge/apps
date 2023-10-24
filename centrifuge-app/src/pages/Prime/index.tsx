import { Network, useCentrifuge, useCentrifugeUtils, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, IconExternalLink, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import aaveLogo from '../../assets/images/aave-token-logo.svg'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { LayoutBase } from '../../components/LayoutBase'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { useFilters } from '../../utils/useFilters'

type DAO = {
  slug: string
  name: string
  network: Network
  address: string
  icon: string
}

const DAOs: DAO[] = [
  {
    slug: 'aave',
    name: 'Aave',
    network: 1,
    address: '0x423420Ae467df6e90291fd0252c0A8a637C1e03f',
    icon: aaveLogo,
  },
  {
    slug: 'gnosis',
    name: 'Gnosis',
    network: 5,
    address: '0x423420Ae467df6e90291fd0252c0A8a637C1e03f',
    icon: aaveLogo,
  },
]

export function PrimePage() {
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
        <Text variant="body1">
          Centrifuge Prime was built to meet the needs of large decentralized organizations and protocols. Through
          Centrifuge Prime, DeFi native organizations can integrate with the largest financial markets in the world and
          take advantage of real yields from real economic activity - all onchain. Assets tailored to your needs,
          processes adapted to your governance, and all through decentralized rails.
        </Text>
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

type Row = DAO & { value?: number; networkName: string }

function DaoPortfoliosTable() {
  const utils = useCentrifugeUtils()
  const cent = useCentrifuge()
  const getNetworkName = useGetNetworkName()
  const { data } = useQuery(['daoPortfolios'], async () => {
    const result = await Promise.all(
      DAOs.map((dao) => {
        const address =
          typeof dao.network === 'number' ? utils.evmToSubstrateAddress(dao.address, dao.network) : dao.address
        return firstValueFrom(cent.pools.getBalances([address]))
      })
    )
    return result
  })

  const mapped: Row[] = DAOs.map((dao, i) => ({
    ...dao,
    value: data?.[i].native.balance.toFloat(),
    networkName: getNetworkName(dao.network),
  }))

  const uniqueNetworks = [...new Set(DAOs.map((dao) => dao.network))]
  const filters = useFilters({ data: mapped })
  console.log('filters.data', filters.data)

  const columns: Column[] = [
    {
      align: 'left',
      header: 'DAO',
      cell: (row: Row) => (
        <Shelf gap={1}>
          <Box as="img" src={row.icon} alt={row.name} width="iconSmall" height="iconSmall" borderRadius="50%" />
          <Text>{row.name}</Text>
        </Shelf>
      ),
      flex: '1',
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
      flex: '3',
    },
    {
      header: <SortableTableHeader label="Portfolio value" />,
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={!row.value}>{row.value && formatBalance(row.value, 'USD')}</TextWithPlaceholder>
      ),
      flex: '3',
      sortKey: 'value',
    },
    {
      header: 'Profit',
      cell: (row: Row) => (
        <TextWithPlaceholder isLoading={!row.value}>{row.value && formatPercentage(row.value)}</TextWithPlaceholder>
      ),
      flex: '3',
    },
  ]

  return (
    <LayoutSection title="DAO portfolios">
      <DataTable columns={columns} data={filters.data} onRowClicked={(row: Row) => `/prime/${row.slug}`} />
    </LayoutSection>
  )
}
