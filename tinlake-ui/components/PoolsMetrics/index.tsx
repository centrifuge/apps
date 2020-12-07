import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { PoolsData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'

interface Props {
  pools: PoolsData
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props
    return (
      <>
        <Box width="256px" pad="medium" elevation="small" round="xsmall" background="white" margin={{ right: '32px' }}>
          <Cont>
            <Value>{pools.ongoingLoans}</Value>
          </Cont>
          <Label>Assets Locked</Label>
        </Box>
        <Box width="256px" pad="medium" elevation="small" round="xsmall" background="white">
          <Cont>
            <TokenLogo src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(pools.totalValue, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <Label>Total value locked</Label>
        </Box>
      </>
    )
  }
}

export default PoolsMetrics

const Cont = styled.div`
  text-align: center;
`

const Value = styled.span`
  font-weight: 500;
  font-size: 24px;
  line-height: 40px;
  color: #333;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 28px;
  color: #333;
`

const Label = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
  color: #979797;
`

const TokenLogo = styled.img`
  margin: 0 8px 0 0;
  width: 24px;
  height: 24px;
  position: relative;
  top: 4px;
`
