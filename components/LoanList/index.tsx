import * as React from 'react';
import Tinlake, { bnToHex, baseToDisplay, feeToInterestRate } from 'tinlake';
import Link from 'next/link';
import { Box, DataTable, Anchor, Text } from 'grommet';
import { connect } from 'react-redux';
import { InternalListLoan, LoansState, getLoans } from '../../ducks/loans';
import NumberDisplay from '../NumberDisplay';
import Badge from '../Badge';
import { Spinner } from '@centrifuge/axis-spinner';
import { DisplayField } from '@centrifuge/axis-display-field';
import { getNFTLink, getAddressLink, hexToInt } from '../../utils/etherscanLinkGenerator'

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

    filteredLoans && filteredLoans.sort((l1, l2) => parseInt(l2.loanId) - parseInt(l1.loanId) )
    
    return <Box pad={{ horizontal: 'medium', bottom: 'large' }}>
      <DataTable data={filteredLoans} sortable columns={[
        { header: <HeaderCell text={'Loan ID'}></HeaderCell>, property: 'loanId', align: 'end' },
        {
          header: 'NFT ID', property: 'tokenId', align: 'end',
          render: (l: InternalListLoan) => 
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField   
                copy={true}
                as={'span'}
                value={hexToInt(bnToHex(l.tokenId).toString())}
                link={{
                    href: getNFTLink(hexToInt(bnToHex(l.tokenId).toString()), l.registry),
                    target: '_blank',
                }}
              />
            </Box>,
        },
        {
          header: 'NFT Owner', property: 'nftOwner', align: 'end',
          render: (l: InternalListLoan) => <div>
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField   
                copy={true}
                as={'span'}
                value={l.loanOwner}
                link={{
                    href: getAddressLink(l.loanOwner),
                    target: '_blank',
                }}
              />
            </Box>
            
          </div>,
        },
        {
          header: '', property: '', align: 'end',
          render: (l: InternalListLoan) => <div> 
            {l.nftOwner === ethFrom && <Badge text={'Me'} />}
          </div>,
        }, 

        { header: <HeaderCell text={'NFT Status'}></HeaderCell>, align: 'end', property: 'status' },
        {
          header: 'Principal (DAI)', property: 'principal', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Whitelisted' ?
            <NumberDisplay suffix="" precision={18}
              value={baseToDisplay(l.principal, 18)} />
            : '-'
        },
        {
          header: <HeaderCell text={'Interest Rate'}></HeaderCell>, property: 'fee', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Repaid' ? '-' :
            <NumberDisplay suffix="%" value={feeToInterestRate(l.fee)} />,
        },
        {
          header: 'Debt (DAI)', property: 'debt', align: 'end',
          render: (l: InternalListLoan) => l.status === 'Whitelisted' ? '-' :
            <NumberDisplay suffix="" precision={18} value={baseToDisplay(l.debt, 18)} />,
        },
        {
          header: 'Actions', property: 'id', align: 'end', sortable: false,
          render: (l: InternalListLoan) =>
          { const loanUrlPrefix = (mode !== '') ? `/${mode}/` : ``
           return  <Link href={`${loanUrlPrefix}loan?loanId=${l.loanId}`}><Anchor>View</Anchor></Link>
          }
      },
      ]} />
    </Box>;
  }
}

const HeaderCell = (props : {text: string}) => (
  <Box pad={{ left: 'small'}}><Text>{props.text}</Text></Box>
);

export default connect(state => state, { getLoans })(LoanList);
