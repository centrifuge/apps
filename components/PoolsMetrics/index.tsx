import * as React from 'react'
import { Box, Text } from 'grommet'
import { PoolsData } from '../../ducks/pools'
import PoolsMetric from '../PoolsMetric'
import DAI from '../../static/dai.json'
import ERC20Display from '../ERC20Display'

interface Props {
  pools: PoolsData
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props
    return (
      <Box direction="row" gap="medium" margin={{ bottom: 'medium' }} justify="evenly">
        <PoolsMetric label="Total Number of Pools">
          <Box direction="row" style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: '0.7em',
                width: '250px',
                height: 40,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {pools.pools.length}
            </Text>
          </Box>
        </PoolsMetric>
        <PoolsMetric label="Total Financed to Date">
          <ERC20Display value={pools.totalFinancedCurrency.toString()} tokenMetas={DAI} precision={0} />
        </PoolsMetric>
      </Box>
    )
  }
}

export default PoolsMetrics
