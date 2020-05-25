import * as React from 'react';
import { Box, Heading } from 'grommet';
import { Investor } from 'tinlake';
import { TrancheType } from '../../../services/tinlake/actions';
import DashboardMetric from '../../DashboardMetric';
import DAI from '../../../static/dai.json';
import ERC20Display from '../../ERC20Display';

interface Props {
  investor: Investor;
  // todo: fix extend tranchetype by tokenData
  tokenData: any;
  type: TrancheType;
}

class TrancheMetric extends React.Component<Props> {
  render() {
    const { type, investor, tokenData } = this.props;
    const { maxSupply, maxRedeem, tokenBalance } = investor[type];
    return <Box margin="none">
      <Box>
        <Heading level="4" margin={{ bottom: 'medium' }}>Investment overview</Heading>
        <Box direction="row" >

            <DashboardMetric label="Investor token balance">
              <ERC20Display value={tokenBalance ? tokenBalance.toString() : '0'} tokenMetas={tokenData} precision={4} />
            </DashboardMetric>

        </Box>
      </Box>

      <Box margin={{ top: 'medium' }}>
        <Heading level="4" margin={{ bottom: 'medium' }}>Invest / Redeem allowance</Heading>
        <Box direction="row" >

            <DashboardMetric label="Investment limit">
              <ERC20Display value={maxSupply ? maxSupply.toString() : '0'} tokenMetas={DAI} precision={2} />
            </DashboardMetric>

            <DashboardMetric label="Redeem limit">
              <ERC20Display value={maxRedeem ? maxRedeem.toString() : '0'} tokenMetas={tokenData} precision={4} />
            </DashboardMetric>

        </Box>
      </Box>
    </Box>;
  }
}

export default TrancheMetric;
