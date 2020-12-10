import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import Router, { withRouter } from 'next/router'
import * as React from 'react'
import { PoolData } from '../../ducks/pools'
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
  pools?: PoolData[]
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
      pools,
      router: {
        query: { showAll, showArchived },
      },
    } = this.props

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
        {pools
          ?.filter((p) => showArchived || !p.isArchived)
          .sort((a, b) => b.order - a.order)
          .map((p) => (
            <PoolRow key={p.id} onClick={() => this.clickPool(p)}>
              <Icon src={p.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'} />
              <Desc>
                <Name>
                  {p.name}{' '}
                  {p.isUpcoming ? (
                    <Label blue>Upcoming</Label>
                  ) : p.isArchived ? (
                    <Label>Archived</Label>
                  ) : (
                    p.isOversubscribed && <Label orange>Oversubscribed</Label>
                  )}
                </Name>
                <Type>{p.asset}</Type>
              </Desc>
              {showAll && (
                <DataCol>
                  <NumberDisplay
                    render={(v) => (
                      <>
                        <Number>{v}</Number> <Unit>DAI</Unit>
                      </>
                    )}
                    precision={0}
                    value={baseToDisplay(p.totalFinancedCurrency, 18)}
                  />
                </DataCol>
              )}

              <DataCol>
                <NumberDisplay
                  precision={0}
                  render={(v) =>
                    v === '0' ? (
                      <Dash>-</Dash>
                    ) : (
                      <>
                        <Number>{v}</Number> <Unit>DAI</Unit>
                      </>
                    )
                  }
                  value={baseToDisplay(p.reserve.add(p.assetValue), 18)}
                />
              </DataCol>
              <DataCol>
                <NumberDisplay
                  render={(v) => (
                    <>
                      <Number>{v}</Number> <Unit>%</Unit>
                    </>
                  )}
                  value={feeToInterestRate(p.seniorInterestRate)}
                />
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
