import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { WithRouterProps } from 'next/dist/client/with-router'
import Link from 'next/link'
import { withRouter } from 'next/router'
import * as React from 'react'
import { toPrecision } from '../../utils/toPrecision'
import { useMedia } from '../../utils/useMedia'
import { PoolData, PoolsData } from '../../utils/usePools'
import { Divider } from '../Divider'
import { Shelf, Stack, Wrap } from '../Layout'
import NumberDisplay from '../NumberDisplay'
import { PoolCapacityLabel } from '../PoolCapacityLabel'
import { Tooltip } from '../Tooltip'
import {
  Dash,
  DataCol,
  Desc,
  Header,
  HeaderCol,
  HeaderSub,
  HeaderTitle,
  Icon,
  Name,
  Number,
  PoolRow,
  SubNumber,
  Type,
  Unit,
} from './styles'

interface Props extends WithRouterProps {
  poolsData?: PoolsData
}

interface Column {
  header: string | JSX.Element
  cell: (p: PoolData) => JSX.Element
  subHeader?: string
}

const getDropAPY = (dropAPY: BN | null) => {
  if (dropAPY) {
    return toPrecision(baseToDisplay(dropAPY.muln(100), 27), 2)
  }
}

const PoolList: React.FC<Props> = (props) => {
  const {
    poolsData,
    router: {
      query: { showAll, showArchived, capacity },
    },
  } = props
  const isMobile = useMedia({ below: 'medium' })

  const pools = poolsData?.pools?.filter((p) => showArchived || !p.isArchived)
  pools?.sort((a, b) => {
    if (a.order === undefined || b.order === undefined || a.order === b.order) return 0
    if (a.order > b.order) return -1
    return 1
  })

  const dataColumns = [
    showAll && {
      header: 'Total Financed',
      cell: (p: PoolData) => (
        <NumberDisplay
          render={(v) => (
            <>
              <Number>{v}</Number> <Unit>{p.currency}</Unit>
            </>
          )}
          precision={0}
          value={baseToDisplay(p.totalFinancedCurrency, 18)}
        />
      ),
    },
    {
      header: 'Investment Capacity',
      cell: (p: PoolData) => <PoolCapacityLabel pool={p} />,
    },
    capacity
      ? [
          {
            header: 'DROP Capacity',
            subHeader: 'Given max reserve',
            cell: (p: PoolData) => (
              <NumberDisplay
                render={(v) => (
                  <>
                    <Number>{v}</Number> <Unit>{p.currency}</Unit>
                  </>
                )}
                precision={0}
                value={baseToDisplay(p.capacityGivenMaxReserve || new BN(0), 18)}
              />
            ),
          },
          {
            header: 'DROP Capacity',
            subHeader: 'Given min TIN risk buffer',
            cell: (p: PoolData) => (
              <NumberDisplay
                render={(v) => (
                  <>
                    <Number>{v}</Number> <Unit>{p.currency}</Unit>
                  </>
                )}
                precision={0}
                value={baseToDisplay(p.capacityGivenMaxDropRatio || new BN(0), 18)}
              />
            ),
          },
        ]
      : [
          {
            header: 'Pool Value',
            cell: (p: PoolData) => (
              <NumberDisplay
                precision={0}
                render={(v) =>
                  v === '0' ? (
                    <Dash></Dash>
                  ) : (
                    <>
                      <Number>{v}</Number> <Unit>{p.currency}</Unit>
                    </>
                  )
                }
                value={baseToDisplay((p.reserve || new BN(0)).add(p.assetValue || new BN(0)), 18)}
              />
            ),
          },
          {
            header: <Tooltip id="dropApy">DROP APY</Tooltip>,
            subHeader: '30 days',
            cell: (p: PoolData) => (
              <NumberDisplay
                render={(v) =>
                  v === '0.00' ? (
                    <Dash>-</Dash>
                  ) : p.isUpcoming ||
                    (!p.assetValue && !p.reserve) ||
                    (p.assetValue?.isZero() && p.reserve?.isZero()) ||
                    !p.seniorYield30Days ? (
                    <SubNumber>Expected: {v} % APR</SubNumber>
                  ) : (
                    <>
                      <Number>{getDropAPY(p.seniorYield30Days)}</Number> <Unit>%</Unit>
                    </>
                  )
                }
                value={feeToInterestRate(p.seniorInterestRate || new BN(0))}
              />
            ),
          },
        ],
    showAll && {
      header: 'TIN APY',
      subHeader: '3 months',
      cell: (p: PoolData) =>
        p.juniorYield90Days === null ? (
          <Unit>N/A</Unit>
        ) : (
          <NumberDisplay
            render={(v) => (
              <>
                <Number>{v}</Number> <Unit>%</Unit>
              </>
            )}
            value={baseToDisplay(p.juniorYield90Days.muln(100), 27)}
          />
        ),
    },
  ]
    .filter(Boolean)
    .flat() as Column[]

  return (
    <Stack gap="small">
      {!isMobile && (
        <Header>
          <Desc>
            <HeaderTitle>Pool</HeaderTitle>
          </Desc>
          {dataColumns.map((col) => (
            <HeaderCol>
              <HeaderTitle>{col.header}</HeaderTitle>
              {col.subHeader && <HeaderSub>{col.subHeader}</HeaderSub>}
            </HeaderCol>
          ))}
        </Header>
      )}
      {pools?.map((p) => (
        <Link href={p.isUpcoming || p.isArchived ? `/pool/${p.slug}` : `/pool/${p.id}/${p.slug}`} shallow passHref>
          <PoolRow as="a" key={p.id} interactive>
            <PoolDetails pool={p} columns={dataColumns} isMobile={isMobile as boolean} />
          </PoolRow>
        </Link>
      ))}
    </Stack>
  )
}

interface DetailsProps {
  isMobile: boolean
  columns: Column[]
  pool: PoolData
}

const PoolDetails: React.FC<DetailsProps> = ({ isMobile, columns, pool }) => {
  const poolIcon = <Icon src={pool.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'} />
  const poolTitle = (
    <Desc>
      <Name>{pool.name}</Name>
      <Type>{pool.asset}</Type>
    </Desc>
  )
  return isMobile ? (
    <Stack gap="small">
      <Shelf gap="small">
        {poolIcon}
        {poolTitle}
      </Shelf>
      <Divider />
      <Stack gap="xsmall">
        {columns.map((col) => (
          <Shelf justifyContent="space-between">
            <Wrap gap="xsmall" rowGap={0}>
              <HeaderTitle>{col.header}</HeaderTitle>
              {col.subHeader && <HeaderSub>{col.subHeader}</HeaderSub>}
            </Wrap>
            <div>{col.cell(pool)}</div>
          </Shelf>
        ))}
      </Stack>
    </Stack>
  ) : (
    <Shelf gap="small">
      {poolIcon}
      {poolTitle}
      {columns.map((col) => (
        <DataCol>{col.cell(pool)}</DataCol>
      ))}
    </Shelf>
  )
}

export default withRouter(PoolList)
