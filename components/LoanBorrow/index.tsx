import * as React from 'react';
import Tinlake, { baseToDisplay, bnToHex, displayToBase } from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, Button, Heading, Text } from 'grommet';
import NftData from '../NftData';
import SecondaryHeader from '../SecondaryHeader';
import Link from 'next/link';
import { LinkPrevious } from 'grommet-icons';
import NumberInput from '../NumberInput';
import NumberDisplay from '../NumberDisplay';
import LoanData from '../LoanData';
import { authTinlake } from '../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import Auth from '../Auth';

const SUCCESS_STATUS = '0x1';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: string, refresh?: boolean) => Promise<void>;
}

interface State {
  borrowAmount: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
  touchedBorrowAmount: boolean;
}

class LoanBorrow extends React.Component<Props, State> {
  state: State = {
    borrowAmount: '',
    is: null,
    errorMsg: '',
    touchedBorrowAmount: false,
  };

  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, this.props.loanId);
  }

  componentDidUpdate(nextProps: Props) {
    const loans = nextProps.loans;
    if (!loans || !loans.singleLoan) { return; }
    if (this.state.touchedBorrowAmount) { return; }

    const { principal } = loans.singleLoan;

    if (principal.toString() === this.state.borrowAmount) { return; }

    this.setState({ borrowAmount: principal.toString() });
  }

  borrow = async () => {
    this.setState({ is: 'loading', touchedBorrowAmount: true });

    try {
      await authTinlake();

      const { getLoan, tinlake, loanId } = this.props;
      const addresses = tinlake.contractAddresses;

      const ethFrom = tinlake.ethConfig.from;

      const loan = await tinlake.getLoan(loanId);

      const res1 = await tinlake.approveNFT(bnToHex(loan.tokenId), addresses['SHELF']);

      if (res1.status !== SUCCESS_STATUS || res1.events[0].event.name !== 'Approval') {
        this.setState({ is: 'error', errorMsg: JSON.stringify(res1) });
        return;
      }

      const res2 = await tinlake.borrow(loanId, ethFrom);

      if (res2.status !== SUCCESS_STATUS) {
        this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
        return;
      }

      await getLoan!(tinlake, loanId, true);

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { loans, loanId, tinlake } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return null; }
    if (singleLoanState === 'not found') {
      return <Alert margin="medium" type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, loanOwner } = singleLoan!;
    const { borrowAmount, is, errorMsg } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href={`/borrower/loan?loanId=${loanId}`}>
            <LinkPrevious />
          </Link>
          <Heading level="3">Borrow Loan {loanId}</Heading>
        </Box>

        {status === 'Whitelisted' && loanOwner === tinlake.ethConfig.from &&
          <Button primary onClick={this.borrow} label="Confirm"
            disabled={is === 'loading' || is === 'success'} />}
      </SecondaryHeader>

      <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization render={auth =>
        auth.user === null &&
          <Alert margin="medium" type="error">Please authenticate to view your loan.</Alert>
      } />

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Borrowing...'} />
      :
        <Box pad={{ horizontal: 'medium' }}>
          {status === 'Whitelisted' && loanOwner === tinlake.ethConfig.from &&
            <Box direction="row" justify="end" margin={{ bottom: 'medium' }}>
              <Text>
                Your Borrow Amount will be <Text weight="bold">{<NumberDisplay
                  value={baseToDisplay(borrowAmount, 18)} suffix=" DAI" precision={18} />}</Text>
              </Text>
            </Box>
          }

          {is === 'success' && <Alert type="success" margin={{ vertical: 'large' }}><Text>
            Successfully borrowed{' '}
            <NumberDisplay value={baseToDisplay(borrowAmount, 18)} suffix=" DAI" precision={18} />
            {' '}for Loan ID {loanId}
          </Text></Alert>}
          {is === 'error' && <Alert type="error" margin={{ vertical: 'large' }}>
            <Text weight="bold">Error borrowing for Loan ID {loanId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}

          <Box direction="row" gap="medium" margin={{ vertical: 'medium' }}>
            <Box basis={'1/4'} gap="medium"><FormField label="Borrow Amount">
              <NumberInput
                value={baseToDisplay(borrowAmount, 18)} suffix=" DAI" precision={18}
                onValueChange={({ value }) => this.setState({
                  borrowAmount: displayToBase(value, 18), touchedBorrowAmount: true })}
                autoFocus disabled={true || is === 'loading' || is === 'success'}
              /></FormField></Box>
            <Box basis={'1/4'} gap="medium" />
            <Box basis={'1/4'} gap="medium" />
            <Box basis={'1/4'} gap="medium" />
          </Box>

          <LoanData loan={singleLoan!} />

          <NftData data={singleLoan!} authedAddr={tinlake.ethConfig.from} />
        </Box>
      }
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanBorrow);
