import * as React from 'react';
import Tinlake, { bnToHex, baseToDisplay, feeToInterestRate } from 'tinlake';
import Link from 'next/link';
import { Box, DataTable, Anchor, Text } from 'grommet';
import { connect } from 'react-redux';
import { InternalListLoan, LoansState, getLoans } from '../../ducks/loans';
import Address from '../Address';
import NumberDisplay from '../NumberDisplay';
import Badge from '../Badge';
import { Spinner } from '@centrifuge/axis-spinner';

interface Props {
  tinlake: Tinlake;
  loans?: LoansState;
  getLoans?: (tinlake: Tinlake) => Promise<void>;
  mode: 'borrower' | 'admin' | '';
}

class LoanList extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoans!(this.props.tinlake);
  }

  render() {
    const { loans, mode, tinlake: { ethConfig: { from: ethFrom } } } = this.props;
    const filteredLoans = mode === 'borrower' ? loans!.loans.filter(l => l.loanOwner === ethFrom) :
      loans!.loans;
    if (loans!.loansState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />;
    }

    return <Box pad={{ horizontal: 'medium', bottom: 'large' }}>
      <DataTable data={filteredLoans} sortable columns={[
        { header: <HeaderCell text={'Loan ID'}></HeaderCell>, property: 'loanId', align: 'end' },
        {
          header: 'NFT ID', property: 'tokenId', align: 'end',
          render: (l: InternalListLoan) => <Address address={bnToHex(l.tokenId
          ).toString()} />,
        },
        {
          header: 'NFT Owner', property: 'nftOwner', align: 'end',
          render: (l: InternalListLoan) => <div>
            <Address address={l.nftOwner} />
            {l.nftOwner === ethFrom && <Badge text={'Me'} style={{ marginLeft: 5 }} />}
          </div>,
        },
        { header: <HeaderCell text={'NFT Status'}></HeaderCell>, align: 'end', property: 'status' },
        {
          header: 'Principal', property: 'principal', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Whitelisted' ?
            <NumberDisplay suffix=" DAI" precision={18}
              value={baseToDisplay(l.principal, 18)} />
            : '-',
        },
        {
          header: <HeaderCell text={'Interest Rate'}></HeaderCell>, property: 'fee', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Repaid' ? '-' :
            <NumberDisplay suffix="%" value={feeToInterestRate(l.fee)} />,
        },
        {
          header: 'Debt', property: 'debt', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Whitelisted' ? '-' :
            <NumberDisplay suffix=" DAI" precision={18} value={baseToDisplay(l.debt, 18)} />,
        },
        {
          header: 'Actions', property: 'id', align: 'end', sortable: false,
          render: (l: InternalListLoan) =>
            <Link href={`/${mode}/loan?loanId=${l.loanId}`}><Anchor>View</Anchor></Link>,
        },
      ]} />
    </Box>;
  }
}

const HeaderCell = (props : {text: string}) => (
  <Box pad={{ left: 'small'}}><Text>{props.text}</Text></Box>
);

export default connect(state => state, { getLoans })(LoanList);
