import * as React from 'react';
import { Box, Text } from 'grommet';
import { baseToDisplay } from 'tinlake';
import NumberDisplay from '../../NumberDisplay';
import { Tranche } from '../../../services/tinlake/actions';
import DashboardMetric from '../../DashboardMetric';
import styled from 'styled-components';
import { calcMaxRedeemAmount } from '../../../utils/maxRedeemAmount';
import NumberInput from '../../NumberInput';

interface Props {
  tranche: Tranche;
}

class TrancheMetric extends React.Component<Props> {
  render() {
    const { availableFunds, tokenPrice, type, token} = this.props.tranche;
    const reserveLabel = `${type} total funds in reserve`;
    const priceLable = `${type} token price`;
    const redeemLabel = `${type} maximum Redeem amount`;
    const maxRedeemAmount = calcMaxRedeemAmount(availableFunds, tokenPrice);
    return <Box>
      <InfoContainer pad={{ vertical: 'large' }}  align="center" margin={{ bottom: 'small' }}>
        <Box basis={'1/2'} gap="medium">
          <DashboardMetric label={priceLable} >
            <NumberDisplay value={baseToDisplay(tokenPrice, 27)} suffix=" DAI" precision={18} />
          </DashboardMetric>
        </Box>
      </InfoContainer>

      <InfoContainer pad={{ vertical: 'large' }} direction="row" >
        <Box basis={'1/2'} gap="medium">
          <DashboardMetric label={reserveLabel} >
            <NumberDisplay value={baseToDisplay(availableFunds, 18)} suffix=" DAI" precision={18} />
          </DashboardMetric>
        </Box>
        <Box basis={'1/2'}  gap="medium">
          <DashboardMetric label={redeemLabel} >
            <NumberDisplay value={maxRedeemAmount.toString()} suffix={token} precision={18}> </NumberDisplay>
          </DashboardMetric>
        </Box>
      </InfoContainer>
    </Box>
  }
}

const InfoContainer = styled(Box)`
  border-radius: 3px;
  background: #f7f7f7;
`;

export default TrancheMetric;

