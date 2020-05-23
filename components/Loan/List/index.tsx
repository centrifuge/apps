import * as React from 'react';
import{ bnToHex, baseToDisplay, feeToInterestRate, Loan } from 'tinlake';
import { Box, DataTable, Text } from 'grommet';
import NumberDisplay from '../../../components/NumberDisplay';
import { DisplayField } from '@centrifuge/axis-display-field';
import { hexToInt } from '../../../utils/etherscanLinkGenerator';
import ChevronRight from '../../ChevronRight';
import { withRouter } from 'next/router';
import { WithRouterProps } from 'next/dist/client/with-router';

interface Props extends WithRouterProps {
  loans: Loan[];
  userAddress: string;
}

class LoanList extends React.Component<Props> {

  clickRow = ({ datum }: { datum?: Loan, index?: number}) => {
    const { root } = this.props.router.query;

    this.props.router.push(`/[root]/loans/loan?loanId=${datum!.loanId}`, `/${root}/loans/loan?loanId=${datum!.loanId}`);
  }

  render() {
    const { loans } =  this.props;
    return <Box>
      <DataTable style={{ tableLayout: 'auto' }} data={loans} sort={{ direction: 'desc', property: 'loanId' }} sortable
        onClickRow={this.clickRow as any} columns={[
          { header: <HeaderCell text={'Loan ID'}></HeaderCell>, property: 'loanId', align: 'end' },
          {
            header: 'NFT ID', property: 'tokenId', align: 'end',
            render: (l: Loan) =>
              <Box style={{ maxWidth: '150px' }}>
                <DisplayField
                  as={'span'}
                  value={hexToInt(bnToHex(l.tokenId).toString())}
                />
              </Box>
          },
          {
            header: 'Outstanding Debt (DAI)', property: 'debt', align: 'end',
            render: (l: Loan) =>
              <NumberDisplay suffix="" precision={2}
                value={baseToDisplay(l.debt, 18)} />
          },
          {
            header: 'Available to borrow (DAI)', property: 'principal', align: 'end',
            render: (l: Loan) =>
              <NumberDisplay suffix="" precision={2}
                value={baseToDisplay(l.principal, 18)} />
          },
          {
            header: <HeaderCell text={'Loan APR'}></HeaderCell>, property: 'fee', align: 'end',
            render: (l: Loan) => l.status === 'Repaid' ? '-' :
              <NumberDisplay suffix="%" precision={2} value={feeToInterestRate(l.interestRate)} />
          },
          {
            header: 'Loan Status', property: 'status', align: 'end',
            render: (l: Loan) => l.status
          },
          {
            header: '', property: 'id', align: 'center', sortable: false, size: '36px',
            render: (_l: Loan) => {
              return <ChevronRight />;
            }
          }
        ]} />
    </Box>;
  }
}
const HeaderCell = (props: { text: string }) => (
  <Box pad={{ left: 'small' }}><Text>{props.text}</Text></Box>
);

export default withRouter<Props>(LoanList);
