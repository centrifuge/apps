import * as React from 'react';
import { Box } from 'grommet';
import { baseToDisplay, feeToInterestRate } from 'tinlake';
import BN from 'bn.js';
import NumberDisplay from '../../NumberDisplay';
import DashboardMetric from '../../DashboardMetric';
import { PoolData } from '../../../ducks/pool';

interface Props {
  data: PoolData;
}

class InvestmentsOverview extends React.Component<Props> {
  render() {
    const { minJuniorRatio, currentJuniorRatio, senior } = this.props.data;
    const seniorInterestRate = senior && (senior as any).interestRate || new BN(0);

    return <Box>
      <Box direction="row" >
        <Box basis={'1/3'} >
          <DashboardMetric label={'Current TIN ratio'} >
            <NumberDisplay value={baseToDisplay(currentJuniorRatio, 25)} suffix={' %'} precision={2} />
          </DashboardMetric>
        </Box>

        <Box basis={'1/3'} >
          <DashboardMetric label={'Minimum TIN ratio'} >
            <NumberDisplay value={baseToDisplay(minJuniorRatio, 25)} suffix={' %'} precision={2} />
          </DashboardMetric>
        </Box>
        <Box basis={'1/3'}  >
          <DashboardMetric label={'DROP APR'}  >
            <NumberDisplay value={feeToInterestRate(seniorInterestRate)} suffix={' %'} precision={2} > </NumberDisplay>
          </DashboardMetric>
        </Box>
      </Box>
    </Box>;
  }
}

export default InvestmentsOverview;
