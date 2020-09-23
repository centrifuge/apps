import * as React from 'react'
import { Box, DataTable } from 'grommet'
import { PoolData } from '../../ducks/pools'
import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import NumberDisplay from '../NumberDisplay'
import ChevronRight from '../ChevronRight'
import Router from 'next/router'

interface Props {
  pools?: PoolData[]
}

class PoolList extends React.Component<Props> {
  clickRow = ({ datum }: { datum?: PoolData; index?: number }) => {
    if (datum?.isUpcoming) {
      Router.push('/pool/[slug]', `/pool/${datum!.slug}`, { shallow: true })
    } else {
      Router.push('/pool/[root]/[slug]', `/pool/${datum!.id}/${datum!.slug}`, { shallow: true })
    }
  }

  getPoolStatus = (pool: PoolData) => {
    if (pool.isUpcoming) return 'Upcoming'
    if (pool.totalDebt.eqn(0) && pool.totalRepaysAggregatedAmount.eqn(0)) return 'Active'
    if (pool.totalDebt.gtn(0)) return 'Deployed'
    if (pool.totalDebt.eqn(0) && pool.totalRepaysAggregatedAmount.gtn(0)) return 'Closed'
    return 'Open'
  }

  render() {
    const { pools } = this.props
    return (
      <Box>
        <DataTable
          style={{ tableLayout: 'auto' }}
          data={pools}
          sortable
          onClickRow={this.clickRow as any}
          sort={{ property: 'order', direction: 'desc' }}
          pad="xsmall"
          columns={[
            {
              header: 'Pool',
              property: 'name',
              align: 'center',
              render: (p: PoolData) => (
                <Box style={{ maxWidth: '200px' }}>
                  <DisplayField as={'span'} value={p.name} />
                </Box>
              ),
            },
            {
              header: 'Status',
              property: 'order',
              align: 'center',
              render: (p: PoolData) => (
                <Box style={{ maxWidth: '200px' }}>
                  <DisplayField as={'span'} value={this.getPoolStatus(p)} />
                </Box>
              ),
            },
            {
              header: 'Asset Type',
              property: 'type',
              align: 'center',
              render: (p: PoolData) => (
                <Box style={{ maxWidth: '150px' }}>
                  <DisplayField as={'span'} value={p.asset} />
                </Box>
              ),
            },
            {
              header: 'Outstanding (DAI)',
              property: 'totalDebtNum',
              align: 'center',
              render: (p: PoolData) => (
                <Box style={{ maxWidth: '150px' }}>
                  <NumberDisplay suffix="" precision={2} value={baseToDisplay(p.totalDebt, 18)} />
                </Box>
              ),
            },
            {
              header: 'Total Repaid (DAI)',
              property: 'totalRepaysAggregatedAmountNum',
              align: 'center',
              render: (p: PoolData) => (
                <NumberDisplay suffix="" precision={2} value={baseToDisplay(p.totalRepaysAggregatedAmount, 18)} />
              ),
            },
            {
              header: 'DROP APR',
              property: 'seniorInterestRateNum',
              align: 'center',
              render: (p: PoolData) => <NumberDisplay suffix="%" value={feeToInterestRate(p.seniorInterestRate)} />,
            },
            {
              header: '',
              property: 'id',
              align: 'center',
              sortable: false,
              size: '36px',
              render: (_p: PoolData) => {
                return <ChevronRight />
              },
            },
          ]}
        />
      </Box>
    )
  }
}

export default PoolList
