import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import Router, { withRouter } from 'next/router'
import * as React from 'react'
import { PoolData, PoolsData } from '../../ducks/pools'
import { toPrecision } from '../../utils/toPrecision'
import { LoadingValue } from '../LoadingValue'
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

const getDropAPY = (dropAPY: BN | null) => {
  if (dropAPY) {
    return toPrecision(baseToDisplay(dropAPY.muln(100), 27), 2)
  }
}

class PoolList extends React.Component<Props> {
  clickRow = ({ datum }: { datum?: PoolData; index?: number }) => {
    if (datum?.isUpcoming || datum?.isArchived) {
      Router.push('/pool/[slug]', `/pool/${datum!.slug}`, { shallow: true })
    } else {
      Router.push('/pool/[root]/[slug]', `/pool/${datum!.id}/${datum!.slug}`, { shallow: true })
    }
  }

  clickPool = (p: PoolData) => {
    if (p.isUpcoming || p.isArchived) {
      Router.push('/pool/[slug]', `/pool/${p.slug}`, { shallow: true })
    } else {
      Router.push('/pool/[root]/[slug]', `/pool/${p.id}/${p.slug}`, { shallow: true })
    }
  }

  render() {
    const {
      poolsData,
      router: {
        query: { showAll, showArchived, capacity },
      },
    } = this.props

    const subgraphIsLoading = this.props.poolsData?.totalValue.isZero()

    const pools = poolsData?.pools?.filter((p) => showArchived || !p.isArchived)
    pools?.sort((a, b) => {
      if (a.order === b.order) return 0 // order doesnt matter
      if (a.order > b.order) return -1 // only a has status, comes first
      return 1 // only b has status, comes first
    })
    console.log(pools?.map((p) => [p.name, p.order]))
    return (
      <Box>
        <Header>
          <Desc>
            <HeaderTitle>Pool</HeaderTitle>
          </Desc>
          {showAll && (
            <HeaderCol>
              <HeaderTitle>Total Financed</HeaderTitle>
            </HeaderCol>
          )}
          <HeaderCol>
            <HeaderTitle>Investment Capacity</HeaderTitle>
          </HeaderCol>
          {capacity && (
            <>
              <HeaderCol>
                <HeaderTitle>DROP Capacity</HeaderTitle>
                <HeaderSub>Given max reserve</HeaderSub>
              </HeaderCol>
              <HeaderCol>
                <HeaderTitle>DROP Capacity</HeaderTitle>
                <HeaderSub>Given min TIN risk buffer</HeaderSub>
              </HeaderCol>
            </>
          )}
          {!capacity && (
            <>
              <HeaderCol>
                <HeaderTitle>Pool Value</HeaderTitle>
              </HeaderCol>
              <HeaderCol>
                <Tooltip id="dropApy">
                  <HeaderTitle>DROP APY</HeaderTitle>
                </Tooltip>
                <HeaderSub>30 days</HeaderSub>
              </HeaderCol>
            </>
          )}
          {showAll && (
            <HeaderCol>
              <HeaderTitle>TIN APY</HeaderTitle>
              <HeaderSub>3 months</HeaderSub>
            </HeaderCol>
          )}
        </Header>
        {pools?.map((p: PoolData) => (
          <PoolRow key={p.id} onClick={() => this.clickPool(p)}>
            <Icon src={p.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'} />
            <Desc>
              <Name>{p.name}</Name>
              <Type>{p.asset}</Type>
            </Desc>
            {showAll && (
              <DataCol>
                <NumberDisplay
                  render={(v) => (
                    <>
                      <Number>{v}</Number> <Unit>{p.currency}</Unit>
                    </>
                  )}
                  precision={0}
                  value={baseToDisplay(p.totalFinancedCurrency, 18)}
                />
              </DataCol>
            )}

            <DataCol>{!subgraphIsLoading && <PoolCapacityLabel pool={p} />}</DataCol>

            {capacity && (
              <>
                <DataCol>
                  <NumberDisplay
                    render={(v) => (
                      <>
                        <Number>{v}</Number> <Unit>{p.currency}</Unit>
                      </>
                    )}
                    precision={0}
                    value={baseToDisplay(p.capacityGivenMaxReserve || new BN(0), 18)}
                  />
                </DataCol>
                <DataCol>
                  <NumberDisplay
                    render={(v) => (
                      <>
                        <Number>{v}</Number> <Unit>{p.currency}</Unit>
                      </>
                    )}
                    precision={0}
                    value={baseToDisplay(p.capacityGivenMaxDropRatio || new BN(0), 18)}
                  />
                </DataCol>
              </>
            )}

            {!capacity && (
              <>
                <DataCol>
                  <LoadingValue done={!subgraphIsLoading} height={28}>
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
                  </LoadingValue>
                </DataCol>
                <DataCol>
                  <LoadingValue done={!subgraphIsLoading} height={28}>
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
                  </LoadingValue>
                </DataCol>
              </>
            )}
            {showAll && (
              <DataCol>
                {p.juniorYield90Days === null ? (
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
                )}
              </DataCol>
            )}
          </PoolRow>
        ))}
      </Box>
    )
  }
}

export default withRouter(PoolList)
