import * as React from 'react';
import { Box } from 'grommet';
import NumberDisplay from '../NumberDisplay';
import { baseToDisplay } from 'tinlake';
import { PoolsData } from '../../ducks/pools';
import PoolsMetric from '../PoolsMetric';

interface Props {
  pools: PoolsData;
}

class PoolsMetrics extends React.Component<Props> {
  render() {
    const { pools } = this.props;
    return <Box direction="row" gap="large" margin={{ bottom: 'medium' }} justify="evenly">
      <PoolsMetric label="Ongoing Pools">
      <span>{pools.ongoingPools}</span>
      </PoolsMetric>
      <PoolsMetric label="Total Ongoing Loans">
      <span>{pools.ongoingLoans}</span>
      </PoolsMetric>
      <PoolsMetric label="Total Outstanding Debt (DAI)">
        <NumberDisplay suffix="" precision={2}
                       value={baseToDisplay(pools.totalDebt, 18)} />
      </PoolsMetric>
      <PoolsMetric label="Total Repaid Debt (DAI)">
        <NumberDisplay suffix="" precision={2}
                       value={baseToDisplay(pools.totalRepaysAggregatedAmount, 18)} />
      </PoolsMetric>
    </Box>;
  }
}

export default PoolsMetrics;
