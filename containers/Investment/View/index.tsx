import * as React from 'react';
import { AuthState } from '../../../ducks/auth';
import { connect } from 'react-redux';
import Link from 'next/link';
import { Box, FormField, TextInput, Button, Heading, Anchor } from 'grommet';
import { isValidAddress } from '../../../utils/address';
import JuniorRatio from '../JuniorRatio';
import InvestmentsOverview from '../../../components/Investment/Overview';
import { AnalyticsState, loadAnalyticsData } from '../../../ducks/analytics';
import { TransactionState, resetTransactionState } from '../../../ducks/transactions';
import Alert from '../../../components/Alert';

interface Props {
  tinlake: any;
  auth: AuthState;
  loadAnalyticsData?: (tinlake: any) => Promise<void>;
  resetTransactionState?: () => void;
  analytics?: AnalyticsState;
  transactions?: TransactionState;
}

interface State {
  errorMsg: string;
  is: string | null;
  investorAddress: string;
}

class InvestmentsView extends React.Component<Props, State> {

  componentWillMount() {
    const { loadAnalyticsData, tinlake } = this.props;
    this.setState({
      investorAddress: ''
    });
    loadAnalyticsData && loadAnalyticsData(tinlake);
  }

  componentWillUnmount() {
    const { resetTransactionState } = this.props;
    resetTransactionState && resetTransactionState();
  }

  render() {
    const { investorAddress, is } = this.state;
    const { analytics, auth, tinlake, transactions } = this.props;
    const canLoadInvestor = (is !== 'loading') && (investorAddress !== '') && isValidAddress(investorAddress);

    return <Box>

      {analytics && analytics.data && <Box margin={{ bottom: "medium" }}> <InvestmentsOverview data={analytics && analytics.data} /> </Box>}

      {transactions && transactions.errorMessage &&
        <Box pad={{ horizontal: 'medium' }} margin={{ bottom: 'small' }}>
          <Alert type="error">
            {transactions.errorMessage}
          </Alert>
        </Box>}

      {analytics && analytics.data && auth && auth.user && auth.user.permissions.canSetMinimumJuniorRatio &&
        <JuniorRatio pad={{ horizontal: 'medium' }} tinlake={tinlake} minJuniorRatio={analytics.data.minJuniorRatio}> </JuniorRatio>
      }


      <Box margin={{ top: 'large' }} pad={{ horizontal: 'medium' }}>
        <Box direction="row" gap="medium" margin={{ top: 'medium' }}>
          <Heading level="4">Load investor details</Heading>
        </Box>
      </Box>

      <Box pad={{ horizontal: 'medium' }}>
        <Box direction="row" gap="medium" margin={{ bottom: 'medium' }}>
          <Box basis={'1/3'}>
            <FormField label="Investor Address">
              <TextInput
                value={investorAddress}
                onChange={(event) =>
                  this.setState({ investorAddress: event.currentTarget.value })}
              />
            </FormField>
          </Box>
          <Box align="start">
            <Link href={{ pathname: `/investments/investor`, query: { investorAddress: this.state.investorAddress } }} >
              <Anchor>
                <Button primary label="Load investor details" disabled={!canLoadInvestor} />
              </Anchor>
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadAnalyticsData, resetTransactionState })(InvestmentsView);
