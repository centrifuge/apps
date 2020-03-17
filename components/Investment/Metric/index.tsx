import * as React from 'react';
import { Box } from 'grommet';
import { baseToDisplay } from 'tinlake';
import NumberDisplay from '../../NumberDisplay';
import { Investor } from '../../../services/tinlake/actions';
import DashboardMetric from '../../DashboardMetric';
import styled from 'styled-components';

interface Props {
  investor: Investor;
}

class InvestorMetric extends React.Component<Props> {
  render() {
    const { maxSupplyJunior, maxRedeemJunior, tokenBalanceJunior } = this.props.investor;

    return <Box >
      <InfoContainer pad={{ vertical: 'large' }}  align="center" margin={{ bottom: 'small' }}>
        <Box gap="medium">
          <DashboardMetric label="Junior token balance">
            <NumberDisplay value={baseToDisplay(tokenBalanceJunior, 18)} suffix=" TIN" precision={18} />
          </DashboardMetric>
        </Box>
      </InfoContainer>

      <InfoContainer pad={{ vertical: 'large' }} direction="row" >
        <Box basis={'1/2'} gap="medium">
          <DashboardMetric label="Junior maximum investment amount">
            <NumberDisplay value={baseToDisplay(maxSupplyJunior, 18)} suffix=" DAI" precision={18} />
          </DashboardMetric>
        </Box>
        {<Box basis={'1/2'} gap="medium">
          <DashboardMetric label="Junior maximum redeem amount">
            <NumberDisplay value={baseToDisplay(maxRedeemJunior, 18)} suffix=" TIN" precision={18} />
          </DashboardMetric>
        </Box>}
      </InfoContainer>
    </Box>;
  }
}

const InfoContainer = styled(Box)`
  border-radius: 3px;
  background: #f7f7f7;
`;

export default InvestorMetric;

