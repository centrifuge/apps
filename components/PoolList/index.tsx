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
    return <Box>
      <DataTable style={{ tableLayout: 'auto' }} data={pools} sortable onClickRow={this.clickRow as any}
        sort={{ property: 'totalDebtNum', direction: 'desc' }} columns={[
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
            header: 'Active Financings', property: 'ongoingLoans', align: 'center',
            render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <DisplayField
                as={'span'}
                value={p.ongoingLoans}
              />
            </Box>
          },
          {
            header: 'Outstanding (DAI)', property: 'totalDebtNum', align: 'center',
            render: (p: PoolData) =>
            <Box style={{ maxWidth: '150px' }}>
              <NumberDisplay suffix="" precision={2} value={baseToDisplay(p.totalDebt, 18)} />
            </Box>
          },
          {
            header: 'Total Repaid (DAI)', property: 'totalRepaysAggregatedAmountNum', align: 'center',
            render: (p: PoolData) =>
            <NumberDisplay suffix="" precision={2} value={baseToDisplay(p.totalRepaysAggregatedAmount, 18)} />
          },
          {
            header: 'Avg Fee', property: 'weightedInterestRateNum', align: 'center',
            render: (p: PoolData) =>
            <NumberDisplay suffix="%" value={feeToInterestRate(p.weightedInterestRate)} />
          },
          {
            header: 'DROP Rate', property: 'seniorInterestRateNum', align: 'center',
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
