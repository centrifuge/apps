import * as React from 'react';
import { Box, Text } from 'grommet';
import { PoolsData } from '../../ducks/pools';
import PoolsMetric from '../PoolsMetric';
import { Erc20Widget } from '../../components/erc20-widget';
import DAI from '../../static/dai.json';
import { baseToDisplay } from 'tinlake';
import ERC20Display from '../ERC20Display';

interface Props {
  pools: PoolsData;
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props;
    return <Box direction="row" gap="large" margin={{ bottom: 'medium' }} justify="evenly">
      <PoolsMetric label="Ongoing Pools" >
        <Box direction="row" style={{  alignItems: 'center' }} >
          <Text style={{ fontSize: '0.8em', width: '212px', height: 40, display: 'flex', justifyContent: 'center',
            alignItems: 'center' }} >
            {pools.ongoingPools}
          </Text>
        </Box>
      </PoolsMetric>
      <PoolsMetric label="Total Ongoing Loans">
        <Box direction="row" style={{ alignItems: 'center' }} >
          <Text style={{ width: '212px', fontSize: '0.8em', height: 40, display: 'flex', justifyContent: 'center',
            alignItems: 'center' }} >
            {pools.ongoingLoans}
          </Text>
        </Box>
      </PoolsMetric>
      <PoolsMetric label="Total Outstanding Debt">
        <ERC20Display
          value={baseToDisplay(pools.totalDebt, 18)}
          tokenMeta={DAI['0x6b175474e89094c44da98b954eedeac495271d0f']} precision={2}
        />
      </PoolsMetric>
      <PoolsMetric label="Total Repaid Debt">
        <ERC20Display
          value={baseToDisplay(pools.totalRepaysAggregatedAmount, 18)}
          tokenMeta={DAI['0x6b175474e89094c44da98b954eedeac495271d0f']} precision={2}
        />
      </PoolsMetric>
    </Box>;
  }
}

export default PoolsMetrics;
