import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import { PoolsData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from './styles'

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
