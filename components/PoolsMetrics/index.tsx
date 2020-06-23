import * as React from 'react';
import { Box, Text } from 'grommet';
import { PoolsData } from '../../ducks/pools';
import PoolsMetric from '../PoolsMetric';
import DAI from '../../static/dai.json';
import ERC20Display from '../ERC20Display';

interface Props {
  pools: PoolsData;
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props;
    return <Box direction="row" gap="medium" margin={{ bottom: 'medium' }} justify="evenly">
      <PoolsMetric label="Ongoing Pools" >
        <Box direction="row" style={{  alignItems: 'center' }} >
          <Text style={{ fontSize: '0.7em', width: '250px', height: 40, display: 'flex', justifyContent: 'center',
            alignItems: 'center' }} >
            {pools.ongoingPools}
          </Text>
        </Box>
      </PoolsMetric>
      <PoolsMetric label="Total Active Financings">
        <Box direction="row" style={{ alignItems: 'center' }} >
          <Text style={{ width: '250px', fontSize: '0.7em', height: 40, display: 'flex', justifyContent: 'center',
            alignItems: 'center' }} >
            {pools.ongoingLoans}
          </Text>
        </Box>
      </PoolsMetric>
      <PoolsMetric label="Total Outstanding Volume">
        <ERC20Display value={pools.totalDebt.toString()} tokenMetas={DAI} precision={2} />
      </PoolsMetric>
      <PoolsMetric label="Total Repaid Volume">
        <ERC20Display value={pools.totalRepaysAggregatedAmount.toString()} tokenMetas={DAI} precision={2} />
      </PoolsMetric>
    </Box>;
  }
}

export default PoolsMetrics;
