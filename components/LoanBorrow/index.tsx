import * as React from 'react';
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, Button, Heading } from 'grommet';
import LoanNftData from '../LoanNftData.tsx';
import { bnToHex } from '../../utils/bnToHex';
import SecondaryHeader from '../SecondaryHeader';
import Link from 'next/link';
import { LinkPrevious } from 'grommet-icons';
import { NumberInput } from '@centrifuge/axis-number-input';
import Number from '../Number';

const SUCCESS_STATUS = '0x1';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: number) => Promise<void>;
}

interface State {
  borrowAmount: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

class LoanBorrow extends React.Component<Props, State> {
  state: State = {
    borrowAmount: '',
    is: null,
    errorMsg: '',
  };

  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, parseInt(this.props.loanId, 10));
  }

  componentDidUpdate(nextProps: Props) {
    const loans = nextProps.loans;
    if (!loans || !loans.singleLoan) { return; }
    const nextPrincipal = loans.singleLoan.principal.toString();
    if (nextPrincipal !== this.state.borrowAmount) {
      this.setState({ borrowAmount: loans.singleLoan.principal.toString() });
    }
  }

  borrow = async () => {
    this.setState({ is: 'loading' });

    const { tinlake, loanId } = this.props;
    const addresses = tinlake.contractAddresses;
    const ethFrom = tinlake.ethConfig.from;

    try {
      // get loan
      const loan = await tinlake.getLoan(parseInt(loanId, 10));

      // approve
      const res1 = await tinlake.approveNFT(bnToHex(loan.tokenId), addresses['SHELF']);

      console.log('approve results');
      console.log(res1.txHash);

      if (res1.status !== SUCCESS_STATUS || res1.events[0].event.name !== 'Approval') {
        console.log(res1);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res1) });
        return;
      }

      // borrow
      const res2 = await tinlake.borrow(loanId, ethFrom);

      console.log('admit result');
      console.log(res2.txHash);

      if (res2.status !== SUCCESS_STATUS) {
        console.log(res2);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
        return;
      }

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { loans, loanId, tinlake } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return 'Loading...'; }
    if (singleLoanState === 'not found') {
      return <Alert type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, principal, fee, loanOwner } = singleLoan!;
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
          <Button primary onClick={this.borrow} label="Confirm" />}
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        {is === 'loading' && 'Borrowing...'}
        {is === 'success' && <Alert type="success" margin={{ top: 'large' }}>
          Successfully borrowed <Number value={borrowAmount} suffix=" DAI" precision={2} />
          for Loan ID {loanId}</Alert>}
        {is === 'error' && <Alert type="error" margin={{ top: 'large' }}>
          <strong>Error borrowing for Loan ID {loanId}, see console for details</strong>
          {errorMsg && <div><br />{errorMsg}</div>}
        </Alert>}

        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/4'} gap="medium"><FormField label="Borrow Amount">
            <NumberInput
              value={borrowAmount} disabled suffix=" DAI" precision={2}
              onChange={e => this.setState({ borrowAmount: e.currentTarget.value })}
            /></FormField></Box>
          <Box basis={'1/4'} gap="medium" />
          <Box basis={'1/4'} gap="medium"><FormField label="Principal">
            <NumberInput value={principal.toString()} disabled suffix=" DAI" precision={2} />
          </FormField></Box>
          <Box basis={'1/4'} gap="medium"><FormField label="Interest Rate">
            <NumberInput value={fee.toString()} disabled suffix="%" />
          </FormField></Box>
        </Box>

        <LoanNftData loan={singleLoan!} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanBorrow);
