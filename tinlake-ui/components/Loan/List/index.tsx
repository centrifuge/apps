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
import { dateToYMD, daysBetween } from '../../../utils/date'

interface Props extends WithRouterProps {
  loans: SortableLoan[]
  userAddress: string
}

import styled from 'styled-components'
import BN from 'bn.js'
type LabelType = 'plain' | 'info' | 'success' | 'warning'
const StatusLabel = styled.div<{ type: LabelType }>`
  background: ${(props) =>
    props.type === 'success'
      ? 'green'
      : props.type === 'warning'
      ? '#fcba59'
      : props.type === 'plain'
      ? 'transparent'
      : '#aaa'};
  border: ${(props) => (props.type === 'plain' ? '1px solid #ccc' : '1px solid transparent')};
  opacity: 0.8;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: ${(props) => (props.type === 'plain' ? '#888' : '#fff')};
  font-weight: bold;
  width: 120px;
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

  getLabelType = (l: SortableLoan): LabelType => {
    const days = daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))
    if (l.status === 'ongoing' && days <= 0) return 'warning'
    if (l.status === 'closed') return 'success'
    if (l.status === 'NFT locked') return 'plain'
    return 'info'
  }

  getLabelText = (l: SortableLoan) => {
    const days = daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))
    if (l.status === 'ongoing' && days === 0) return 'due today'
    else if (l.status === 'ongoing' && days === 1) return 'due tomorrow'
    else if (l.status === 'ongoing' && days > 1 && days <= 7)
      return `due in ${daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))} days`
    else if (l.status === 'ongoing' && days < 0)
      return `due ${daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))} days ago`
    return l.status
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
                    value={baseToDisplay(
                      l.status === 'closed'
                        ? l.repaysAggregatedAmount || new BN(0)
                        : l.debt.isZero()
                        ? l.principal
                        : l.debt,
                      18
                    )}
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
                size: '130px',
                render: (l: SortableLoan) => (
                  <StatusLabel type={this.getLabelType(l)}>{this.getLabelText(l)}</StatusLabel>
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
        {loans.length === 0 && <Text margin="medium">No assets have been originated.</Text>}
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
