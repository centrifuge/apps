import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, bnToHex, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Box, DataTable, Text } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import { withRouter } from 'next/router'
import * as React from 'react'
import NumberDisplay from '../../../components/NumberDisplay'
import { SortableLoan } from '../../../ducks/loans'
import { hexToInt } from '../../../utils/etherscanLinkGenerator'
import ChevronRight from '../../ChevronRight'
import { dateToYMD } from '../../../utils/date'

interface Props extends WithRouterProps {
  loans: SortableLoan[]
  userAddress: string
}

import styled from 'styled-components'
const StatusLabel = styled.div<{ type: 'info' | 'success' | 'warning' }>`
  background: ${(props) => (props.type === 'success' ? 'green' : props.type === 'warning' ? '#fcba59' : '#aaa')};
  opacity: 0.8;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
  width: 100px;
  text-align: center;
`

class LoanList extends React.Component<Props> {
  clickRow = ({ datum }: { datum?: SortableLoan; index?: number }) => {
    const { root, slug } = this.props.router.query

    this.props.router.push(
      `/pool/[root]/[slug]/assets/asset?assetId=${datum!.loanId}`,
      `/pool/${root}/${slug}/assets/asset?assetId=${datum!.loanId}`,
      { shallow: true }
    )
  }

  render() {
    const { loans } = this.props
    return (
      <Box
        width="100%"
        elevation="small"
        round="xsmall"
        pad={{ top: 'xsmall' }}
        margin={{ bottom: 'medium' }}
        background="white"
      >
        {loans.length > 0 && (
          <DataTable
            style={{ tableLayout: 'auto' }}
            data={loans}
            sort={{ direction: 'desc', property: 'loanId' }}
            pad="xsmall"
            sortable
            onClickRow={this.clickRow as any}
            columns={[
              {
                header: 'Asset ID',
                property: 'loanId',
                align: 'center',
                size: '140px',
              },
              {
                header: 'NFT ID',
                primary: true,
                property: 'tokenId',
                align: 'start',
                size: '440px',
                render: (l: SortableLoan) => (
                  <Box style={{ maxWidth: '200px' }}>
                    <DisplayField as={'span'} value={hexToInt(bnToHex(l.tokenId).toString())} />
                  </Box>
                ),
              },
              {
                header: 'Maturity Date',
                property: 'maturityDate',
                align: 'end',
                render: (l: SortableLoan) => (l.maturityDate && l.maturityDate > 0 ? dateToYMD(l.maturityDate) : '-'),
              },
              {
                header: 'Amount (DAI)',
                property: 'amountNum',
                align: 'end',
                render: (l: SortableLoan) => (
                  <NumberDisplay
                    suffix=""
                    precision={0}
                    value={baseToDisplay(l.debt.isZero() ? l.principal : l.debt, 18)}
                  />
                ),
              },
              {
                header: <HeaderCell text={'Financing Fee'}></HeaderCell>,
                property: 'interestRateNum',
                align: 'end',
                render: (l: SortableLoan) =>
                  l.status === 'Repaid' ? (
                    '-'
                  ) : (
                    <NumberDisplay suffix=" %" precision={2} value={feeToInterestRate(l.interestRate)} />
                  ),
              },
              {
                header: 'Status',
                property: 'status',
                align: 'start',
                size: '110px',
                render: (l: SortableLoan) => (
                  <StatusLabel type={l.status === 'closed' ? 'success' : 'info'}>{l.status}</StatusLabel>
                ),
              },
              {
                header: '',
                property: 'id',
                align: 'center',
                sortable: false,
                size: '36px',
                render: (_l: SortableLoan) => {
                  return <ChevronRight />
                },
              },
            ]}
          />
        )}
        {loans.length === 0 && <Text>No assets have been originated.</Text>}
      </Box>
    )
  }
}
const HeaderCell = (props: { text: string }) => (
  <Box pad={{ left: 'small' }}>
    <Text>{props.text}</Text>
  </Box>
)

export default withRouter<Props>(LoanList)
