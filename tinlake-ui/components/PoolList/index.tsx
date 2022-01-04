import { UiPoolDataProvider } from '@aave/contract-helpers'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { WithRouterProps } from 'next/dist/client/with-router'
import Link from 'next/link'
import { withRouter } from 'next/router'
import * as React from 'react'
import { PropsOf } from '../../helpers'
import { toPrecision } from '../../utils/toPrecision'
import { useMedia } from '../../utils/useMedia'
import { PoolData, PoolsData } from '../../utils/usePools'
import { useDebugFlags } from '../DebugFlags'
import { Divider } from '../Divider'
import { SectionHeading } from '../Heading'
import { Shelf, Stack } from '../Layout'
import { PoolCapacityLabel } from '../PoolCapacityLabel'
import { IconExternalLink } from '../RewardsBanner/IconExternalLink'
import { useTinlake } from '../TinlakeProvider'
import { Tooltip } from '../Tooltip'
import { Value } from '../Value'
import { ValuePairList } from '../ValuePairList'
import {
  DataCol,
  DataColLeft,
  Desc,
  Header,
  HeaderCol,
  HeaderColLeft,
  HeaderSub,
  HeaderTitle,
  Icon,
  Name,
  PoolRow,
  SubNumber,
  Type,
} from './styles'

interface Props extends WithRouterProps {
  poolsData?: PoolsData
}

interface Column {
  header: string | React.ReactNode
  cell: (row: any) => React.ReactNode
  subHeader?: string
}

const getDropAPY = (dropAPY: BN | null) => {
  if (dropAPY) {
    return toPrecision(baseToDisplay(dropAPY.muln(100), 27), 2)
  }
}

const toNumber = (value: BN | undefined, decimals: number) => {
  return value ? parseInt(value.toString(), 10) / 10 ** decimals : 0
}

const isAlignedLeft = (c: Column) => c.header === 'Investment Capacity'

// group pools to sort them (e.g. active pools first, then launching pools and then upcoming pools at the bottom)
const poolGroups = [
  (p: PoolData) => !p.isUpcoming && !p.isLaunching, // active pools
  (p: PoolData) => p.isLaunching, // launching pools
  (p: PoolData) => p.isUpcoming, // upcoming pools
]

const getPoolGroupIndex = (p: PoolData): number => {
  for (let i = 0; i < poolGroups.length; i += 1) {
    if (poolGroups[i](p)) return i
  }
  return -1
}

const PoolList: React.FC<Props> = ({ poolsData }) => {
  const { showAll, showArchived, showCapacity } = useDebugFlags()
  const isMobile = useMedia({ below: 'medium' })

  const pools = poolsData?.pools?.filter((p) => showArchived || !p.isArchived)

  pools?.sort((a, b) => {
    const groupA = getPoolGroupIndex(a)
    const groupB = getPoolGroupIndex(b)

    if (groupA > groupB) return 1
    if (groupA < groupB) return -1

    // if the pools are in the same group, use order (if defined)
    if (a.order === undefined || b.order === undefined || a.order === b.order) return 0
    if (a.order > b.order) return -1
    return 1
  })

  const dataColumns = [
    showAll && {
      header: 'Total Financed',
      cell: (p: PoolData) => <Value value={toNumber(p.totalFinancedCurrency, 18)} unit={p.currency} />,
    },
    {
      header: 'Investment Capacity',
      cell: (p: PoolData) => <PoolCapacityLabel pool={p} />,
    },
    showCapacity
      ? [
          {
            header: 'DROP Capacity',
            subHeader: 'Given max reserve',
            cell: (p: PoolData) => <Value value={toNumber(p.capacityGivenMaxReserve, 18)} unit={p.currency} />,
          },
          {
            header: 'DROP Capacity',
            subHeader: 'Given min TIN risk buffer',
            cell: (p: PoolData) => <Value value={toNumber(p.capacityGivenMaxDropRatio, 18)} unit={p.currency} />,
          },
        ]
      : [
          {
            header: 'Pool Value',
            cell: (p: PoolData) => (
              <Value value={toNumber((p.reserve || new BN(0)).add(p.assetValue || new BN(0)), 18)} unit={p.currency} />
            ),
          },
          {
            header: (
              <Tooltip id="seniorApy" underline>
                Senior APY
              </Tooltip>
            ),
            subHeader: '30 days',
            cell: (p: PoolData) => {
              const v = feeToInterestRate(p.seniorInterestRate || new BN(0))
              return v === '0.00' ? (
                <Value value="" unit="-" />
              ) : p.isUpcoming ||
                (!p.assetValue && !p.reserve) ||
                (p.assetValue?.isZero() && p.reserve?.isZero()) ||
                !p.seniorYield30Days ||
                p.seniorYield30Days.isZero() ? (
                <SubNumber>Expected: {v} % APR</SubNumber>
              ) : (
                <Value value={parseFloat(getDropAPY(p.seniorYield30Days) || '0').toFixed(2)} unit="%" />
              )
            },
          },
        ],
    showAll && {
      header: 'Junior APY',
      subHeader: '90 days',
      cell: (p: PoolData) =>
        p.juniorYield90Days === null ? (
          <Value value="" unit="N/A" />
        ) : (
          <Value value={toNumber(p.juniorYield90Days.muln(100), 27)} unit="%" />
        ),
    },
  ]
    .filter(Boolean)
    .flat() as Column[]

  return (
    <Stack gap="small">
      {isMobile ? (
        <SectionHeading>Pools</SectionHeading>
      ) : (
        <Header>
          <Desc>
            <HeaderTitle>Pool</HeaderTitle>
          </Desc>
          {dataColumns.map((col) => {
            const Col = isAlignedLeft(col) ? HeaderColLeft : HeaderCol
            return (
              <Col>
                <HeaderTitle>{col.header}</HeaderTitle>
                {col.subHeader && <HeaderSub>{col.subHeader}</HeaderSub>}
              </Col>
            )
          })}
        </Header>
      )}
      <Link href={'https://rwamarket.io/'} shallow passHref key="rwa-market">
        <RwaMarketRow isMobile={isMobile as boolean} />
      </Link>
      {pools?.map((p, i) => (
        <Link href={p.isArchived ? `/pool/${p.slug}` : `/pool/${p.id}/${p.slug}`} shallow passHref key={`${p.id}-${i}`}>
          <Row
            row={p}
            columns={dataColumns}
            isMobile={isMobile as boolean}
            icon={p.icon || ''}
            title={p.name}
            type={p.asset}
            as="a"
            interactive
          />
        </Link>
      ))}
    </Stack>
  )
}

interface DetailsProps {
  isMobile: boolean
  columns: Column[]
  row: any
  icon?: string
  title?: string
  type?: string
}

export const Row: React.FC<DetailsProps & PropsOf<typeof PoolRow>> = ({
  isMobile,
  columns,
  row,
  icon,
  title,
  type,
  ...rest
}) => {
  const poolIcon = <Icon src={icon} />
  const poolTitle = (
    <Stack gap="xsmall" flex="1 1 auto">
      <Name>{title}</Name>
      <Type>{type}</Type>
    </Stack>
  )
  return (
    <PoolRow {...rest}>
      {isMobile ? (
        <Stack gap="small">
          <Shelf gap="xsmall">
            {poolIcon}
            {poolTitle}
          </Shelf>
          <Divider bleedX="small" width="auto" />
          <ValuePairList
            variant="primary"
            items={columns.map((col) => ({ term: col.header, termSuffix: col.subHeader, value: col.cell(row) }))}
          />
        </Stack>
      ) : (
        <Shelf gap="small">
          {poolIcon}
          {poolTitle}
          {columns.map((col) => {
            const Col = isAlignedLeft(col) ? DataColLeft : DataCol
            return <Col>{col.cell(row)}</Col>
          })}
        </Shelf>
      )}
    </PoolRow>
  )
}

interface RwaMarketRowProps {
  isMobile: boolean
}

export const RwaMarketRow: React.FC<RwaMarketRowProps> = ({ isMobile }) => {
  const tinlake = useTinlake()

  const poolIcon = <Icon src={'/static/rwa-market-icon.png'} />
  const poolTitle = (
    <Stack gap="xsmall" flex="1 1 auto">
      <Name>
        Real-World Asset Market <IconExternalLink />
      </Name>
      <Type>Market of RWA pools, built on the Aave protocol</Type>
    </Stack>
  )

  const [marketSize, setMarketSize] = React.useState(new BN(0))

  const columns = [
    {
      header: 'Investment Capacity',
      cell: () => <PoolCapacityLabel />,
    },
    {
      header: 'Pool Value',
      cell: () => <Value value={toNumber(marketSize, 0)} unit={'$'} />,
    },
    {
      header: () => (
        <Tooltip id="seniorApy" underline>
          Senior APY
        </Tooltip>
      ),
      subHeader: '30 days',
      cell: () => {
        return <Value value="" unit="-" />
      },
    },
  ]
    .filter(Boolean)
    .flat() as Column[]

  const getMarketData = async () => {
    const uiPoolDataProvider = new UiPoolDataProvider({
      uiPoolDataProviderAddress: '0x47e300dDd1d25447482E2F7e5a5a967EA2DA8634',
      provider: tinlake.provider,
    })
    const reservesData = await uiPoolDataProvider.getReservesData('0xB953a066377176092879a151C07798B3946EEa4b')
    setMarketSize(
      reservesData[0].reduce(
        (sum, reserve) =>
          sum.add(
            new BN(reserve.availableLiquidity.toString()).div(new BN(10).pow(new BN(reserve.decimals.toString())))
          ),
        new BN(0)
      )
    )
  }

  React.useEffect(() => {
    getMarketData()
  }, [])

  return (
    <PoolRow interactive as="a">
      {isMobile ? (
        <Stack gap="small">
          <Shelf gap="xsmall">
            {poolIcon}
            {poolTitle}
          </Shelf>
          <Divider bleedX="small" width="auto" />
          <ValuePairList
            variant="primary"
            items={columns.map((col) => ({ term: col.header, termSuffix: col.subHeader, value: col.cell() }))}
          />
        </Stack>
      ) : (
        <Shelf gap="small">
          {poolIcon}
          {poolTitle}
          {columns.map((col) => {
            const Col = isAlignedLeft(col) ? DataColLeft : DataCol
            return <Col>{col.cell()}</Col>
          })}
        </Shelf>
      )}
    </PoolRow>
  )
}

export default withRouter(PoolList)
