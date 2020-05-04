import * as React from 'react';
import { Box, Heading } from 'grommet';
import { baseToDisplay } from 'tinlake';
import NumberDisplay from '../../NumberDisplay';
import { Investor, Tranche, TrancheType } from '../../../services/tinlake/actions';
import DashboardMetric from '../../DashboardMetric';
import { calcMaxRedeemAmount } from '../../../utils/maxRedeemAmount';

interface Props {
  investor: Investor;
  tranche: Tranche;
  type: TrancheType;
}

class TrancheMetric extends React.Component<Props> {
  render() {
    const { type, investor, tranche } = this.props;
    const { maxSupply, maxRedeem, tokenBalance } = investor[type];
    const { availableFunds, tokenPrice, token  } = tranche;
    const currencyLabel = ` ${token}`;
    const maxRedeemAmount = calcMaxRedeemAmount(availableFunds, tokenPrice);

    return <Box margin="none">
      <Box>
        <Heading level="4" margin={{ bottom: 'medium' }}>Investment overview</Heading>
        <Box direction="row" >
          <Box basis={'1/3'} gap="medium">
            <DashboardMetric label="Investor token balance">
              <NumberDisplay value={baseToDisplay(tokenBalance, 18)} suffix={currencyLabel} precision={18} />
            </DashboardMetric>
          </Box>
        </Box>
      </Box>

      <Box margin={{top: 'medium' }}>
        <Heading level="4" margin={{ bottom: 'medium' }}>Invest / Redeem allowance</Heading>
        <Box direction="row" >
          <Box basis={'1/3'} gap="medium">
            <DashboardMetric label="Investment limit">
              <NumberDisplay value={baseToDisplay(maxSupply, 18)} suffix=" DAI" precision={18} />
            </DashboardMetric>
          </Box>
          <Box basis={'1/3'} gap="medium">
            <DashboardMetric label="Redeem limit">
              <NumberDisplay value={baseToDisplay(maxRedeem, 18)} suffix={currencyLabel} precision={18} />
            </DashboardMetric>
          </Box>
          {/* <Box basis={'1/3'} gap="medium">
            <DashboardMetric label={`Tranche token total`}>
              <NumberDisplay value={maxRedeemAmount.toString()} suffix={currencyLabel} precision={18} />
            </DashboardMetric>
          </Box> */}
        </Box>
      </Box>
    </Box>;
  }
}

export default TrancheMetric;
