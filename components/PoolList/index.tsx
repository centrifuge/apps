import * as React from 'react';
import { Anchor, Box, DataTable } from 'grommet';
import { PoolData } from '../../ducks/pools';
import { DisplayField } from '@centrifuge/axis-display-field';
import { baseToDisplay, feeToInterestRate } from 'tinlake';
import NumberDisplay from '../NumberDisplay';
import Link from 'next/link';

interface Props {
  pools?: PoolData[];
}

class PoolList extends React.Component<Props> {
  render() {
    const { pools } =  this.props;
    return <Box margin={{ bottom: 'xlarge' }}>
      <DataTable style={{ tableLayout: 'auto' }} data={pools} sortable columns={[
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
              <NumberDisplay suffix="" precision={4}
              value={baseToDisplay(p.totalDebt, 18)} />
            </Box>
        },
        {
          header: 'Total Repaid Debt (DAI)', property: 'totalRepaid', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="" precision={4}
            value={baseToDisplay(p.totalRepaysAggregatedAmount, 18)} />
        },
        {
          header: 'Avg Interest Rate (APY)', property: 'avgInterest', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="%" value={feeToInterestRate(p.weightedInterestRate)} />
        },
        {
          header: 'DROP Interest Rate', property: 'dropInterest', align: 'center',
          render: (p: PoolData) =>
            <NumberDisplay suffix="%" value={feeToInterestRate(p.weightedInterestRateDrop)} />
        }
        ,
        {
          header: 'Actions', property: 'id', align: 'center',
          render: (p: PoolData) => {
            return <Box direction="row" gap="small">
                <Link href={p.id }>
              <Anchor>View </Anchor></Link>
              <Link href={`${p.id}/loans/issue`}>
                <Anchor>Open Loan</Anchor></Link>
              <Link href={`${p.id}/investments`}>
                <Anchor>Invest</Anchor></Link>
            </Box>;
          }
        }
      ]} />
    </Box>;
  }
}

export default PoolList;
