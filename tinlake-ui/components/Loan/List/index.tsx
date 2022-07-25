import { DisplayField } from '@centrifuge/axis-display-field'
import { Spinner } from '@centrifuge/axis-spinner'
import { baseToDisplay, bnToHex, feeToInterestRate, Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { DataTable, Text } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useQuery } from 'react-query'
import styled from 'styled-components'
import NumberDisplay from '../../../components/NumberDisplay'
import { Pool } from '../../../config'
import { dateToYMD } from '../../../utils/date'
import { hexToInt } from '../../../utils/etherscanLinkGenerator'
import { saveAsCSV } from '../../../utils/export'
import { useMedia } from '../../../utils/useMedia'
import { calculateWriteOffPercentage } from '../../../utils/useWriteOffPercentage'
import { ButtonGroup } from '../../ButtonGroup'
import { Card } from '../../Card'
import ChevronRight from '../../ChevronRight'
import { useDebugFlags } from '../../DebugFlags'
import { Box } from '../../Layout'
import { useTinlake } from '../../TinlakeProvider'
import LoanLabel from '../Label'

interface Props {
  loans: Loan[]
  userAddress: string
  activePool?: Pool
}

const LoanList: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { showExport } = useDebugFlags()
  const tinlake = useTinlake()

  const { isFetching: isFetchingLoansWithWriteOffStatus, data: loansWithWriteOffStatusData } = useQuery(
    ['loansWithWriteOffStatus', props.loans],
    async () => {
      const loans: Loan[] = []
      for (const loan of props.loans) {
        const writeOffPercentage = await calculateWriteOffPercentage(tinlake, Number(loan.loanId))

        loans.push({
          ...loan,
          status: writeOffPercentage === '100' ? 'repaid' : loan.status,
        })
      }

      return loans
    }
  )

  const clickRow = React.useCallback(
    ({ datum }: { datum?: Loan; index?: number }) => {
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
              render: (l: Loan) => (
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
              header: 'Financing Fee',
              property: 'interestRateNum',
              align: 'end',
              sortable: false,
              render: (l: Loan) =>
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
              render: (l: Loan) => <LoanLabel loan={l} dot />,
            },
            {
              header: '',
              property: 'id',
              align: 'center',
              sortable: false,
              size: '36px',
              render: () => {
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
              render: (l: Loan) => (
                <Box style={{ maxWidth: '200px' }}>
                  <DisplayField as={'span'} value={hexToInt(bnToHex(l.tokenId).toString())} />
                </Box>
              ),
            },
            {
              header: 'Financing Date',
              property: 'financingDate',
              align: 'end',
              render: (l: Loan) => (l.financingDate && l.financingDate > 0 ? dateToYMD(l.financingDate) : '-'),
            },
            {
              header: 'Maturity Date',
              property: 'maturityDate',
              align: 'end',
              render: (l: Loan) => (l.maturityDate && l.maturityDate > 0 ? dateToYMD(l.maturityDate) : '-'),
            },
            {
              header: `Amount (${props.activePool?.metadata.currencySymbol || 'DAI'})`,
              property: 'amountNum',
              align: 'end',
              render: (l: Loan) => (
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
              header: 'Financing Fee',
              property: 'interestRateNum',
              align: 'end',
              render: (l: Loan) =>
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
              render: (l: Loan) => <LoanLabel loan={l} />,
            },
            {
              header: '',
              property: 'id',
              align: 'center',
              sortable: false,
              size: '36px',
              render: () => {
                return <ChevronRight />
              },
            },
          ],
    [isMobile]
  )

  return (
    <>
      <StyledCard bleedX={['12px', 0]} width="auto" pt="xsmall" mb="medium" borderRadius={[0, '8px']}>
        {isFetchingLoansWithWriteOffStatus ? (
          <Spinner height={'400px'} message={'Loading...'} />
        ) : loansWithWriteOffStatusData ? (
          <DataTable
            style={{ tableLayout: 'auto' }}
            data={loansWithWriteOffStatusData}
            sort={{ direction: 'desc', property: 'loanId' }}
            pad="xsmall"
            sortable
            onClickRow={clickRow as any}
            columns={columns as any}
          />
        ) : (
          <Box px="small" pb="small" pt="xsmall">
            <Text>No assets have been originated.</Text>
          </Box>
        )}
      </StyledCard>
      {showExport && (
        <ButtonGroup>
          <ExportLink onClick={() => saveAsCSV(loansWithWriteOffStatusData as Loan[])}>
            Export Asset List as CSV
          </ExportLink>
        </ButtonGroup>
      )}
    </>
  )
}

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
