import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, bnToHex, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, DataTable, Text } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import styled from 'styled-components'
import NumberDisplay from '../../../components/NumberDisplay'
import { Pool } from '../../../config'
import { SortableLoan } from '../../../ducks/loans'
import { dateToYMD } from '../../../utils/date'
import { hexToInt } from '../../../utils/etherscanLinkGenerator'
import { saveAsCSV } from '../../../utils/export'
import { useMedia } from '../../../utils/useMedia'
import { Card } from '../../Card'
import ChevronRight from '../../ChevronRight'
import LoanLabel from '../Label'

interface Props {
  loans: SortableLoan[]
  userAddress: string
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  const clickRow = React.useCallback(
    ({ datum }: { datum?: SortableLoan; index?: number }) => {
      const { root, slug } = router.query

      router.push(
        `/pool/[root]/[slug]/assets/asset?assetId=${datum!.loanId}`,
        `/pool/${root}/${slug}/assets/asset?assetId=${datum!.loanId}`,
        { shallow: true }
      )
    },
    [router]
  )

  const isMobile = useMedia({ below: 'medium' })

  const columns = React.useMemo(
    () =>
      isMobile
        ? [
            {
              header: 'ID',
              property: 'loanId',
              align: 'center',
              sortable: false,
            },
            {
              header: `Amount (${props.activePool?.metadata.currencySymbol || 'DAI'})`,
              property: 'amountNum',
              align: 'end',
              sortable: false,
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
              sortable: false,
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
              align: 'center',
              sortable: false,
              render: (l: SortableLoan) => <LoanLabel loan={l} dot />,
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
          ]
        : [
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
              render: (l: SortableLoan) => (l.financingDate && l.financingDate > 0 ? dateToYMD(l.financingDate) : '-'),
            },
            {
              header: 'Maturity Date',
              property: 'maturityDate',
              align: 'end',
              render: (l: SortableLoan) => (l.maturityDate && l.maturityDate > 0 ? dateToYMD(l.maturityDate) : '-'),
            },
            {
              header: `Amount (${props.activePool?.metadata.currencySymbol || 'DAI'})`,
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
          ],
    [isMobile]
  )

  return (
    <>
      <StyledCard bleedX={['12px', 0]} width="auto" pt="xsmall" mb="medium" borderRadius={[0, '8px']}>
        {props.loans.length > 0 && (
          <DataTable
            style={{ tableLayout: 'auto' }}
            data={props.loans}
            sort={{ direction: 'desc', property: 'loanId' }}
            pad="xsmall"
            sortable
            onClickRow={clickRow as any}
            columns={columns as any}
          />
        )}
        {props.loans.length === 0 && <Text margin="medium">No assets have been originated.</Text>}
      </StyledCard>
      {'export' in router.query && (
        <Box justify="end">
          <ExportLink onClick={() => saveAsCSV(props.loans)}>Export Asset List as CSV</ExportLink>
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

const StyledCard = styled(Card)`
  thead {
    position: sticky;
    top: 56px;
    background: white;
  }
`

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
