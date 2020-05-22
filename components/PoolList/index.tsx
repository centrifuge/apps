import * as React from 'react';
import { Box, DataTable } from 'grommet';
import { PoolData } from '../../ducks/pools';
import { DisplayField } from '@centrifuge/axis-display-field';
import { baseToDisplay, feeToInterestRate } from 'tinlake';
import NumberDisplay from '../NumberDisplay';
import ChevronRight from '../ChevronRight';
import Router from 'next/router';

interface Props {
  pools?: PoolData[];
}

class PoolList extends React.Component<Props> {

  clickRow = ({ datum }: { datum?: PoolData, index?: number}) => {
    Router.push('/[root]', `/${datum!.id}`, { shallow: true });
  }

  render() {
    const { pools } =  this.props;
    return <Box margin={{ bottom: 'xlarge' }}>
      <DataTable style={{ tableLayout: 'auto' }} data={pools} sortable onClickRow={this.clickRow as any} columns={[
        {
          header: 'Pool', property: 'name', align: 'center',
          render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField
                as={'span'}
                value={p.name}
              />
            </Box>
        },
        {
          header: 'Asset Type', property: 'type', align: 'center',
          render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField
                as={'span'}
                value={p.asset}
              />
            </Box>
        },
        {
          header: 'Ongoing Loans', property: 'ongoingLoans', align: 'center',
          render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField
                as={'span'}
                value={p.ongoingLoans}
              />
            </Box>
        },
        {
          header: 'Outstanding Debt (DAI)', property: 'totalDebt', align: 'center',
          render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <NumberDisplay suffix="" precision={2}
              value={baseToDisplay(p.totalDebt, 18)} />
            </Box>
        },
        {
          header: 'Total Repaid Debt (DAI)', property: 'totalRepaid', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="" precision={2}
            value={baseToDisplay(p.totalRepaysAggregatedAmount, 18)} />
        },
        {
          header: 'Avg Loan APR', property: 'avgInterest', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="%" value={feeToInterestRate(p.weightedInterestRate)} />
        },
        {
          header: 'DROP APR', property: 'dropInterest', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="%" value={feeToInterestRate(p.seniorInterestRate)} />
        }
        ,
        {
          header: '', property: 'id', align: 'center', sortable: false, size: '36px',
          render: (_p: PoolData) => {
            return <ChevronRight />;
          }
        }
      ]} />
    </Box>;
  }
}

export default PoolList;
