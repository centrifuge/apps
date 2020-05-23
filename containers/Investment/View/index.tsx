import * as React from 'react';
import { AuthState } from '../../../ducks/auth';
import { connect } from 'react-redux';
import { Box, FormField, TextInput, Button, Heading, Anchor } from 'grommet';
import { isValidAddress } from '../../../utils/address';
import JuniorRatio from '../JuniorRatio';
import InvestmentsOverview from '../../../components/Investment/Overview';
import { PoolState, loadPool } from '../../../ducks/pool';
import { TransactionState, resetTransactionState } from '../../../ducks/transactions';
import Alert from '../../../components/Alert';
import { PoolLink } from '../../../components/PoolLink';

interface Props {
  tinlake: any;
  auth: AuthState;
  loadPool?: (tinlake: any) => Promise<void>;
  resetTransactionState?: () => void;
  pool?: PoolState;
  transactions?: TransactionState;
}

interface State {
  errorMsg: string;
  is: string | null;
  investorAddress: string;
}

class InvestmentsView extends React.Component<Props, State> {
  state: State = {
    errorMsg: '',
    is: null,
    investorAddress: ''
  };

  componentDidMount() {
    const { loadPool, tinlake } = this.props;
    loadPool && loadPool(tinlake);
  }

  componentWillUnmount() {
    const { resetTransactionState } = this.props;
    resetTransactionState && resetTransactionState();
  }

  render() {
    const { investorAddress, is } = this.state;
    const { pool, auth, tinlake, transactions } = this.props;
    const canLoadInvestor = (is !== 'loading') && (investorAddress !== '') && isValidAddress(investorAddress);

    return <Box>

      {pool?.data && <Box margin={{ bottom: 'medium' }}> <InvestmentsOverview data={pool?.data} /> </Box>}

      {transactions && transactions.errorMessage &&
        <Box pad={{ horizontal: 'medium' }} margin={{ bottom: 'small' }}>
          <Alert type="error">
            {transactions.errorMessage}
          </Alert>
        </Box>}

      {pool?.data && auth.permissions?.canSetMinimumJuniorRatio &&
        <JuniorRatio tinlake={tinlake} minJuniorRatio={pool.data.minJuniorRatio} />
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
                onChange={event =>
                  this.setState({ investorAddress: event.currentTarget.value })}
              />
            </FormField>
          </Box>
          <Box align="start">
            <PoolLink href={{ pathname: '/investments/investor', query: { investorAddress: this.state.investorAddress }
            }}>
              <Anchor>
                <Button primary label="Load investor details" disabled={!canLoadInvestor} />
              </Anchor>
            </PoolLink>
          </Box>
        </Box>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadPool, resetTransactionState })(InvestmentsView);
