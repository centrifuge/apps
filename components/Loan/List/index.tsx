import * as React from 'react';
import{ bnToHex, baseToDisplay, feeToInterestRate } from 'tinlake';
import { Box, DataTable, Text } from 'grommet';
import NumberDisplay from '../../../components/NumberDisplay';
import { DisplayField } from '@centrifuge/axis-display-field';
import { hexToInt } from '../../../utils/etherscanLinkGenerator';
import ChevronRight from '../../ChevronRight';
import { SortableLoan } from '../../../ducks/loans';
import { withRouter } from 'next/router';
import { WithRouterProps } from 'next/dist/client/with-router';

interface Props extends WithRouterProps {
  loans: SortableLoan[];
  userAddress: string;
}

class LoanList extends React.Component<Props> {

  clickRow = ({ datum }: { datum?: SortableLoan, index?: number}) => {
    const { root } = this.props.router.query;

    this.props.router.push(`/[root]/assets/asset?assetId=${datum!.loanId}`, `/${root}/assets/asset?assetId=${datum!.loanId}`,
                           { shallow: true });
  }

  render() {
    const { loans } =  this.props;
    return <Box>
      <DataTable style={{ tableLayout: 'auto' }} data={loans} sort={{ direction: 'desc', property: 'loanId' }} sortable
        onClickRow={this.clickRow as any} columns={[
          { header: <HeaderCell text={'Asset ID'}></HeaderCell>, property: 'loanId', align: 'end' },
          {
            header: 'NFT ID', primary: true, property: 'tokenId', align: 'end',
            render: (l: SortableLoan) =>
              <Box style={{ maxWidth: '150px' }}>
                <DisplayField
                  as={'span'}
                  value={hexToInt(bnToHex(l.tokenId).toString())}
                />
              </Box>
          },
          {
            header: 'Outstanding (DAI)', property: 'debtNum', align: 'end',
            render: (l: SortableLoan) =>
              <NumberDisplay suffix="" precision={2} value={baseToDisplay(l.debt, 18)} />
          },
          {
            header: 'Available for Financing (DAI)', property: 'principalNum', align: 'end',
            render: (l: SortableLoan) =>
              <NumberDisplay suffix="" precision={2} value={baseToDisplay(l.principal, 18)} />
          },
          {
            header: <HeaderCell text={'Financing Fee'}></HeaderCell>, property: 'interestRateNum', align: 'end',
            render: (l: SortableLoan) => l.status === 'Repaid' ? '-' :
              <NumberDisplay suffix="%" precision={2} value={feeToInterestRate(l.interestRate)} />
          },
          {
            header: 'Status', property: 'status', align: 'end',
            render: (l: SortableLoan) => l.status
          },
          {
            header: '', property: 'id', align: 'center', sortable: false, size: '36px',
            render: (_l: SortableLoan) => {
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
