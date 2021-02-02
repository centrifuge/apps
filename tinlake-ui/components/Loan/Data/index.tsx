import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay, feeToInterestRate, ITinlake, Loan } from '@centrifuge/tinlake-js'
import { Box, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { AuthState } from '../../../ducks/auth'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { dateToYMD } from '../../../utils/date'
import { getAddressLink } from '../../../utils/etherscanLinkGenerator'
import { toPrecision } from '../../../utils/toPrecision'
import { LoadingValue } from '../../LoadingValue'
import LoanLabel from '../Label'

interface Props {
  loan: Loan
  tinlake: ITinlake
  auth?: AuthState
}

const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 200px;
  > div {
    padding: 0;
  }
`

const LoanData: React.FC<Props> = (props: Props) => {
  return (
    <Box gap="medium" pad="medium" elevation="small" round="xsmall" background="white" width="80%">
      <Box direction="row">
        <span
          style={{
            marginRight: '24px',
            color: '#999',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            position: 'relative',
            top: '4px',
            letterSpacing: '0.5px',
          }}
        >
          Status:
        </span>
        <LoadingValue value={props.loan} height={28} alignRight={false}>
          {(loan) => <LoanLabel loan={loan} />}
        </LoadingValue>
      </Box>
      <Box direction="row" justify="between">
        <Box width="360px">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Available for Financing</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue value={props.loan?.principal}>
                    {(principal) => `${addThousandsSeparators(toPrecision(baseToDisplay(principal, 18), 2))} DAI`}
                  </LoadingValue>
                  <LoadingValue value={props.loan?.principal}>
                    {(principal) => `${addThousandsSeparators(toPrecision(baseToDisplay(principal, 18), 2))} DAI`}
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Outstanding</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue value={props.loan?.debt}>
                    {(debt) => `${addThousandsSeparators(toPrecision(baseToDisplay(debt, 18), 2))} DAI`}
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row" border={{ color: 'transparent' }}>
                  Maturity date
                </TableCell>
                <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                  <LoadingValue value={props.loan?.nft?.maturityDate}>
                    {(maturityDate) => dateToYMD(maturityDate)}
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box width="360px">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Risk group</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue value={props.loan?.riskGroup}>{(riskGroup) => riskGroup}</LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Financing fee</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  <LoadingValue value={props.loan?.interestRate}>
                    {(interestRate) => `${toPrecision(feeToInterestRate(interestRate), 2)} %`}
                  </LoadingValue>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row" border={{ color: 'transparent' }}>
                  Financed by
                </TableCell>
                <TableCell style={{ textAlign: 'end', float: 'right' }} border={{ color: 'transparent' }}>
                  <LoadingValue value={props.loan?.borrower} height={24}>
                    {(borrower) => (
                      <DisplayFieldWrapper>
                        <DisplayField
                          copy={true}
                          as={'span'}
                          value={borrower}
                          link={{
                            href: getAddressLink(borrower),
                            target: '_blank',
                          }}
                        />
                      </DisplayFieldWrapper>
                    )}
                  </LoadingValue>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  )
}

export default LoanData
