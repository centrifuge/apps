import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import { withRouter } from 'next/router'
import * as React from 'react'
import { PoolsData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from './styles'

interface Props extends WithRouterProps {
  pools: PoolsData
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const {
      pools,
      router: {
        query: { showAll },
      },
    } = this.props
    return (
      <>
        {showAll && (
          <Box
            width="256px"
            pad="medium"
            elevation="small"
            round="xsmall"
            background="white"
            margin={{ horizontal: '16px' }}
          >
            <Cont>
              <Value>{pools.ongoingLoans}</Value>
            </Cont>
            <Label>Assets Locked</Label>
          </Box>
        )}
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <Cont>
            <TokenLogo src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(pools.totalFinancedCurrency, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <Label>Total Financed to Date</Label>
        </Box>
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <Cont>
            <TokenLogo src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(pools.totalValue, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <Label>Current Value Locked</Label>
        </Box>
      </>
    )
  }
}

export default withRouter(PoolsMetrics)
