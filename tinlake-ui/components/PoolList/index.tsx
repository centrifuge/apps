import { addThousandsSeparators, baseToDisplay, feeToInterestRate, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import Router, { withRouter } from 'next/router'
import * as React from 'react'
import { PoolData, PoolsData } from '../../ducks/pools'
import { LoadingValue } from '../LoadingValue'
import NumberDisplay from '../NumberDisplay'
import {
  Dash,
  DataCol,
  Desc,
  Header,
  HeaderCol,
  HeaderSub,
  HeaderTitle,
  Icon,
  Label,
  Name,
  Number,
  PoolRow,
  Type,
  Unit,
} from './styles'

interface Props extends WithRouterProps {
  poolsData?: PoolsData
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
        query: { showAll, showArchived },
      },
    } = this.props

    const subgraphIsLoading = this.props.poolsData?.totalValue.isZero()

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
          <HeaderCol>
            <HeaderTitle>Pool Value</HeaderTitle>
          </HeaderCol>
          <HeaderCol>
            <HeaderTitle>DROP APR</HeaderTitle>
          </HeaderCol>
          {showAll && (
            <>
              <HeaderCol>
                <HeaderTitle>DROP Yield</HeaderTitle>
                <HeaderSub>14 days</HeaderSub>
              </HeaderCol>
              <HeaderCol>
                <HeaderTitle>TIN Yield</HeaderTitle>
                <HeaderSub>14 days</HeaderSub>
              </HeaderCol>
            </>
          )}
        </Header>
        {poolsData?.pools
          ?.filter((p) => showArchived || !p.isArchived)
          .sort((a, b) => b.order - a.order)
          .map((p: PoolData) => (
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

              <DataCol>
                {p.isUpcoming ||
                (!subgraphIsLoading &&
                  ((!p.assetValue && !p.reserve) || (p.assetValue?.isZero() && p.reserve?.isZero()))) ? (
                  <Label blue>Upcoming</Label>
                ) : p.isArchived ? (
                  <Label>Archived</Label>
                ) : p.isOversubscribed ? (
                  <Label orange>Oversubscribed</Label>
                ) : (
                  <Label green>
                    {addThousandsSeparators(toPrecision(baseToDisplay(p.capacity || new BN(0), 18), 0))} {p.currency}
                  </Label>
                )}
              </DataCol>

              <DataCol>
                <LoadingValue done={!subgraphIsLoading} height={28}>
                  <NumberDisplay
                    precision={0}
                    render={(v) =>
                      v === '0' ? (
                        <Dash>-</Dash>
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
                      ) : (
                        <>
                          <Number>{v}</Number> <Unit>%</Unit>
                        </>
                      )
                    }
                    value={feeToInterestRate(p.seniorInterestRate || new BN(0))}
                  />
                </LoadingValue>
              </DataCol>
              {showAll && (
                <>
                  <DataCol>
                    {p.seniorYield14Days === null ? (
                      <Unit>N/A</Unit>
                    ) : (
                      <NumberDisplay
                        render={(v) => (
                          <>
                            <Number>{v}</Number> <Unit>%</Unit>
                          </>
                        )}
                        value={baseToDisplay(p.seniorYield14Days.muln(100), 27)}
                      />
                    )}
                  </DataCol>
                  <DataCol>
                    {p.juniorYield14Days === null ? (
                      <Unit>N/A</Unit>
                    ) : (
                      <NumberDisplay
                        render={(v) => (
                          <>
                            <Number>{v}</Number> <Unit>%</Unit>
                          </>
                        )}
                        value={baseToDisplay(p.juniorYield14Days.muln(100), 27)}
                      />
                    )}
                  </DataCol>
                </>
              )}
            </PoolRow>
          ))}
      </Box>
    )
  }
}

export default withRouter(PoolList)
