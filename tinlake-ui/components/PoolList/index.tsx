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
    if (datum?.isUpcoming || datum?.isArchived) {
      Router.push('/pool/[slug]', `/pool/${datum!.slug}`, { shallow: true })
    } else {
      Router.push('/pool/[root]/[slug]', `/pool/${datum!.id}/${datum!.slug}`, { shallow: true })
    }
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
                  <DisplayField as={'span'} value={p.status} />
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
              header: 'Total Financed (DAI)',
              property: 'totalFinancedCurrency',
              align: 'center',
              render: (p: PoolData) =>
                p.isArchived ? (
                  <NumberDisplay suffix="" precision={0} value={baseToDisplay(p.totalFinancedCurrency, 18)} />
                ) : (
                  <NumberDisplay
                    suffix=""
                    precision={0}
                    value={baseToDisplay(p.totalRepaysAggregatedAmount.add(p.totalDebt), 18)}
                  />
                ),
            },
            {
              header: 'DROP APR',
              property: 'seniorInterestRateNum',
              align: 'center',
              render: (p: PoolData) => <NumberDisplay suffix=" %" value={feeToInterestRate(p.seniorInterestRate)} />,
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
