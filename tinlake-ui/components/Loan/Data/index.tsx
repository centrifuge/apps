import * as React from 'react'
import { Box, Table, TableBody, TableRow, TableCell } from 'grommet'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Loan } from '@centrifuge/tinlake-js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import { AuthState } from '../../../ducks/auth'
import { ITinlake } from '@centrifuge/tinlake-js'
import { dateToYMD } from '../../../utils/date'
import LoanLabel from '../Label'
import { DisplayField } from '@centrifuge/axis-display-field'
import { getAddressLink } from '../../../utils/etherscanLinkGenerator'

interface Props {
  loan: Loan
  tinlake: ITinlake
  auth?: AuthState
}

import styled from 'styled-components'
const DisplayFieldWrapper = styled.div`
  width: 100%;
  max-width: 200px;
  > div {
    padding: 0;
  }
`

const LoanData: React.FC<Props> = (props: Props) => {
  const { debt, principal, interestRate, borrower } = props.loan

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
        <LoanLabel loan={props.loan} />
      </Box>
      <Box direction="row" justify="between">
        <Box width="360px">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Available for Financing</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(principal, 18), 2))} DAI
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Outstanding</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(debt, 18), 2))} DAI
                </TableCell>
              </TableRow>
              {props.loan.nft && (
                <>
                  {(props.loan.nft as any).maturityDate && (
                    <TableRow>
                      <TableCell scope="row" border={{ color: 'transparent' }}>
                        Maturity date
                      </TableCell>
                      <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                        {dateToYMD((props.loan.nft as any).maturityDate)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box width="360px">
          <Table>
            <TableBody>
              {/* <TableRow>
                <TableCell scope="row">Status</TableCell>
                <TableCell style={{ textAlign: 'end', float: 'right', height: '21px !important' }}>
                </TableCell>
              </TableRow> */}
              {props.loan.nft && (
                <>
                  <TableRow>
                    <TableCell scope="row">Risk group</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>{(props.loan as any).riskGroup}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Financing fee</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {toPrecision(feeToInterestRate(interestRate), 2)} %
                    </TableCell>
                  </TableRow>
                </>
              )}
              {borrower && (
                <TableRow>
                  <TableCell scope="row" border={{ color: 'transparent' }}>
                    Financed by
                  </TableCell>
                  <TableCell style={{ textAlign: 'end', float: 'right' }} border={{ color: 'transparent' }}>
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
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  )
}

export default LoanData
