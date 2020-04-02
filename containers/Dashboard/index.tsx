import * as React from 'react';
import Tinlake from 'tinlake';
import { connect } from 'react-redux';
import { Box, Heading } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';
import { AlayticsState } from '../../ducks/analyics';
import { LoansState, loadLoans } from '../../ducks/loans';
import { Spinner } from '@centrifuge/axis-spinner';
import LoanListData from  '../../components/Loan/List';

interface Props {
  tinlake: any;
  dashboard?: Analyticstate;
  loans?: LoansState;
  loadLoans?: (tinlake: any) => Promise<void>;
}

class Dashboard extends React.Component<Props> {

  componentWillMount() {
    this.props.loadLoans(this.props.tinlake);
  }
  
  render() {
    const { tinlake, loans } = this.props;

    return <Box >
      <SecondaryHeader>
          <Heading level="3">Loans</Heading>
      </SecondaryHeader>
      { (loans!.loansState === 'loading') ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />  :
        <LoanListData loans={loans!.loans} userAddress={tinlake.ethConfig.from}> </LoanListData>
      }

      <Box pad={{ vertical: 'medium' }}>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoans })(Dashboard);
