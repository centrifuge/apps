import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, bnToHex, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, DataTable, Text } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import styled from 'styled-components'
import NumberDisplay from '../../../components/NumberDisplay'
import { SortableLoan } from '../../../ducks/loans'
import { dateToYMD } from '../../../utils/date'
import { hexToInt } from '../../../utils/etherscanLinkGenerator'
import { saveAsCSV } from '../../../utils/export'
import ChevronRight from '../../ChevronRight'
import LoanLabel from '../Label'

interface Props {
  loans: SortableLoan[]
  userAddress: string
}

const LoanList: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  const clickRow = ({ datum }: { datum?: SortableLoan; index?: number }) => {
    const { root, slug } = router.query

    router.push(
      `/pool/[root]/[slug]/assets/asset?assetId=${datum!.loanId}`,
      `/pool/${root}/${slug}/assets/asset?assetId=${datum!.loanId}`,
      { shallow: true }
    )
  }

  return (
    <>
      <Box
        width="100%"
        elevation="small"
        round="xsmall"
        pad={{ top: 'xsmall' }}
        margin={{ bottom: 'medium' }}
        background="white"
      >
        {props.loans.length > 0 && (
          <DataTable
            style={{ tableLayout: 'auto' }}
            data={props.loans}
            sort={{ direction: 'desc', property: 'loanId' }}
            pad="xsmall"
            sortable
            onClickRow={clickRow as any}
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
                size: '260px',
                render: (l: SortableLoan) => (
                  <Box style={{ maxWidth: '200px' }}>
                    <DisplayField as={'span'} value={hexToInt(bnToHex(l.tokenId).toString())} />
                  </Box>
                ),
              },
              {
                header: 'Financing Date',
                property: 'financingDate',
                align: 'end',
                render: (l: SortableLoan) =>
                  l.financingDate && l.financingDate > 0 ? dateToYMD(l.financingDate) : '-',
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
                render: (l: SortableLoan) => <LoanLabel loan={l} />,
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
        {props.loans.length === 0 && <Text margin="medium">No assets have been originated.</Text>}
      </Box>
      {'export' in router.query && (
        <Box justify="end">
          <ExportLink onClick={() => saveAsCSV(props.loans)}>Export asset list as CSV</ExportLink>
        </Box>
      )}
    </>
  )
}

const HeaderCell = (props: { text: string }) => (
  <Box pad={{ left: 'small' }}>
    <Text>{props.text}</Text>
  </Box>
)

const ExportLink = styled.a`
  color: #333;
  text-decoration: underline;
  margin: 0 16px 12px 0;
  font-size: 13px;
  cursor: pointer;
  text-align: right;

  &:hover,
  &:focus {
    color: #000;
  }
`

export default LoanList
