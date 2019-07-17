import * as React from 'react';
import Tinlake from 'tinlake';
import { connect } from 'react-redux';
import { Box, Heading, Text } from 'grommet';
import SecondaryHeader from '../SecondaryHeader';
import { DashboardState, subscribeDashboardData } from '../../ducks/dashboard';
import { baseToDisplay } from '../../utils/baseToDisplay';
import { calcRatioPercent } from '../../utils/calcRatioPercent';
import DashboardMetric from '../DashboardMetric';
import NumberDisplay from '../NumberDisplay';

interface Props {
  tinlake: Tinlake;
  dashboard?: DashboardState;
  subscribeDashboardData?: (tinlake: Tinlake) => () => void;
}

class Dashboard extends React.Component<Props> {
  discardSubscription = () => { };

  componentWillMount() {
    this.discardSubscription = this.props.subscribeDashboardData!(this.props.tinlake);
  }

  componentWillUnmount() {
    this.discardSubscription();
  }

  render() {
    const { dashboard } = this.props;
    const { state, data } = dashboard!;

    if (data === null || state === 'loading') { return 'Loading...'; }

    const { loanCount, totalDebt, totalValueOfNFTs } = data!;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Heading level="3">Status Dashboard</Heading>
        </Box>
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <Box direction="row" gap="medium" margin={{ vertical: 'medium' }}>
          <Box basis={'1/4'} gap="medium">
            <DashboardMetric label="DAI, Outstanding Debt">
              <NumberDisplay value={baseToDisplay(totalDebt, 18)} />
            </DashboardMetric>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <DashboardMetric label="DAI, Collateral Value">
              <NumberDisplay value={baseToDisplay(totalValueOfNFTs, 18)} />
            </DashboardMetric>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <DashboardMetric label="Collateral Value / Debt">
              <NumberDisplay value={calcRatioPercent(totalValueOfNFTs, totalDebt)} suffix=" %" />
            </DashboardMetric>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <DashboardMetric label="Number of Loans">
              <NumberDisplay value={loanCount.toString()} precision={0} />
            </DashboardMetric>
          </Box>
        </Box>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { subscribeDashboardData })(Dashboard);
