import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import Router from 'next/router'
import * as React from 'react'
import styled from 'styled-components'
import { PoolData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'

interface Props {
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
    const { pools } = this.props
    return (
      <Box>
        <Header>
          <Desc>
            <HeaderTitle>Pool</HeaderTitle>
          </Desc>
          <HeaderCol>
            <HeaderTitle>Pool Value</HeaderTitle>
          </HeaderCol>
          <HeaderCol>
            <HeaderTitle>DROP Yield</HeaderTitle>
            <HeaderSub>14 days</HeaderSub>
          </HeaderCol>
          <HeaderCol>
            <HeaderTitle>TIN Yield</HeaderTitle>
            <HeaderSub>14 days</HeaderSub>
          </HeaderCol>
        </Header>
        {pools?.map((p) => (
          <PoolRow key={p.id} onClick={() => this.clickPool(p)}>
            <Icon></Icon>
            <Desc>
              <Name>{p.name}</Name>
              <Type>{p.asset}</Type>
            </Desc>
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
                value={baseToDisplay(p.totalRepaysAggregatedAmount.add(p.totalDebt), 18)}
              />
            </DataCol>{' '}
            {/* TODO */}
            <DataCol>
              <NumberDisplay
                render={(v) => (
                  <>
                    <Number>{v}</Number> <Unit>%</Unit>
                  </>
                )}
                value={feeToInterestRate(p.seniorInterestRate)}
              />
            </DataCol>{' '}
            {/* TODO */}
            <DataCol>
              <NumberDisplay
                render={(v) => (
                  <>
                    <Number>{v}</Number> <Unit>%</Unit>
                  </>
                )}
                value={feeToInterestRate(p.seniorInterestRate)}
              />
            </DataCol>{' '}
            {/* TODO */}
          </PoolRow>
        ))}
      </Box>
    )
  }
}

export default PoolList

const Header = styled.div`
  padding: 16px;
  display: flex;
`

const PoolRow = styled.div`
  padding: 16px;
  display: flex;
  border-radius: 8px;
  box-shadow: 0 2px 6px #00000030;
  background: white;
  margin-bottom: 16px;
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 6px #00000060;
  }
`

const Icon = styled.img`
  width: 40px;
  height: 40px;
  margin-right: 16px;
`

const Desc = styled.div`
  flex: 1 1 auto;
`

const Name = styled.h3`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 28px;
  color: #333;
`

const Type = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
  color: #979797;
`

const HeaderCol = styled.div`
  width: 120px;
  margin-left: 16px;
  text-align: right;
`

const DataCol = styled(HeaderCol)`
  align-self: center;
`

const Number = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 28px;
  color: #333;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
  color: #979797;
`

const Dash = styled(Number)`
  color: #979797;
`

const HeaderTitle = styled.h4`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #777;
`

const HeaderSub = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
  color: #979797;
`
