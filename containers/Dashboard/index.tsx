import * as React from 'react';
import Tinlake, { baseToDisplay } from 'tinlake';
import { ApolloClient, TinlakeEventEntry } from '../../services/appollo';
import { connect } from 'react-redux';
import { Box, Heading, Select, FormField } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';
import { DashboardState, subscribeDashboardData } from '../../ducks/dashboard';
import { calcRatioPercent } from '../../utils/calcRatioPercent';
import DashboardMetric from '../../components/DashboardMetric';
import NumberDisplay from '../../components/NumberDisplay';
import LoanList from '../../components/LoanList';
import { Graph, TimeSeriesData } from '../../components/Graph';
import config from '../../config';

const periodSelectionOptions = ['7d', '30d', '90d'];
const defaultPeriodSelection = '7d';

interface Props {
  tinlake: Tinlake;
  appolloClient: ApolloClient;
  dashboard?: DashboardState;
  subscribeDashboardData?: (tinlake: Tinlake) => () => void;
}

interface State {
  colleteralTimeSeriesPeriod: string;
  colleteralValueTimeSeriesData: TimeSeriesData;
  showColleteralGraph: boolean
}

class Dashboard extends React.Component<Props, State> {

  discardSubscription = () => { };

  // handlers
  onColleteralTimeSeriesPeriodSelected = async (event: {value: typeof periodSelectionOptions[number]}) => {
    const period = event.value;
    this.setState({
      colleteralTimeSeriesPeriod: period,
    });
    await this.updateColleteralTimeSeriesData(period);
  }

  updateColleteralTimeSeriesData = async (period: string) => {
    const timeSeriesData = await this.props.appolloClient.getColleteralTimeSeriesData(period);
    const colleteralValueTimeSeriesData = {
      labels: [],
      xValues: [
        { data: [], backgroundColor: 'rgba(51,51,51,1)', label: 'Outstanding Debt' },
        { data: [], backgroundColor: 'rgba(9,41,190,1)', label: 'Colleteral Value' },
      ],
    };

    const updatedColleteralValueTimeSeriesData = timeSeriesData.reduce((colleteralValueTimeSeriesData: TimeSeriesData, entry: TinlakeEventEntry) => {
      const dateLabel = (new Date(parseInt(entry.timestamp, 10))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      colleteralValueTimeSeriesData.labels.push(dateLabel);
      colleteralValueTimeSeriesData.xValues[0].data.push((parseInt(entry.total_debt, 10) / Math.pow(10, 18)).toFixed(2));
      colleteralValueTimeSeriesData.xValues[1].data.push((parseInt(entry.total_value_of_nfts, 10) / Math.pow(10, 18)).toFixed(2));
      return colleteralValueTimeSeriesData;
    },                                                                 colleteralValueTimeSeriesData);

    this.setState({
      colleteralValueTimeSeriesData: updatedColleteralValueTimeSeriesData,
    });
  }

  componentWillMount() {
    this.discardSubscription = this.props.subscribeDashboardData!(this.props.tinlake);
    this.setState({
      colleteralTimeSeriesPeriod: defaultPeriodSelection,
      colleteralValueTimeSeriesData: {
        labels: [],
        xValues: [
          { data: [], backgroundColor: 'rgba(51,51,51,1)', label: 'Oustanding Debt' },
          { data: [], backgroundColor: 'rgba(9,41,190,1)', label: 'Colleteral Value' },
        ],
      },
      showColleteralGraph: !!config.tinlakeDataBackendUrl
    });
    this.updateColleteralTimeSeriesData(defaultPeriodSelection);
  }

  componentWillUnmount() {
    this.discardSubscription();
  }

  render() {
    const { dashboard, tinlake } = this.props;
    const { state, data } = dashboard!;

    if (data === null || state === 'loading') { return null; }

    const { loanCount, totalDebt, totalValueOfNFTs } = data!;

    return <Box >
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
     { this.state.showColleteralGraph &&
        <Box>
          <Box pad={{ horizontal: 'right', top: 'medium' }} align="end">
            <FormField>
              <Select
                onChange={this.onColleteralTimeSeriesPeriodSelected}
                value={this.state.colleteralTimeSeriesPeriod}
                options={periodSelectionOptions}
              />
            </FormField>
          </Box> 
          <Box pad={{ horizontal: 'right', top: 'medium' }}>
            <Graph timeSeriesData={this.state.colleteralValueTimeSeriesData}></Graph>
          </Box>
        </Box>
      }

      <Box pad={{ horizontal: 'medium', top: 'medium' }}>
        <Heading level="4">Recent Loans</Heading>
      </Box>

      <LoanList tinlake={tinlake} mode="admin" />
    </Box>;
  }
}

export default connect(state => state, { subscribeDashboardData })(Dashboard);
