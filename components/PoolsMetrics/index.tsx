import * as React from 'react';
import { Box, Text } from 'grommet';
import { PoolsData } from '../../ducks/pools';
import PoolsMetric from '../PoolsMetric';
import { Erc20Widget } from '../../components/erc20-widget';
import DAI from '../../static/dai.json';

interface Props {
  pools: PoolsData;
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props;
    return <Box direction="row" gap="large" margin={{ bottom: 'medium' }} justify="evenly">
      <PoolsMetric label="Ongoing Pools" >
        <Box direction="row" style={{  alignItems: 'center' }} >
            <Text style={{ fontSize: '0.8em', width: '212px' }} >
               {pools.ongoingPools}
            </Text>
        </Box>

      </PoolsMetric>
      <PoolsMetric label="Total Ongoing Loans">
      <Box direction="row" style={{ alignItems: 'center' }} >
            <Text style={{ width: '212px', fontSize: '0.8em' }} >
               {pools.ongoingLoans}
            </Text>
        </Box>
      </PoolsMetric>
      <PoolsMetric label="Total Outstanding Debt">
        <Erc20Widget value={pools.totalDebt.toString()} tokenData={DAI} precision={2} />

      </PoolsMetric>
      <PoolsMetric label="Total Repaid Debt">
        <Erc20Widget value={pools.totalRepaysAggregatedAmount.toString()} tokenData={DAI} precision={2} />
      </PoolsMetric>
    </Box>;
  }
}

export default PoolsMetrics;
