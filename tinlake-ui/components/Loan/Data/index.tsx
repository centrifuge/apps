import * as React from 'react'
import { Box, Table, TableBody, TableRow, TableCell, Heading } from 'grommet'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Loan } from '@centrifuge/tinlake-js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import { AuthState } from '../../../ducks/auth'
import { ITinlake } from '@centrifuge/tinlake-js'
import { dateToYMD } from '../../../utils/date'
import LoanLabel from '../Label'

interface Props {
  loan: Loan
  tinlake: ITinlake
  auth?: AuthState
}

const LoanData: React.FC<Props> = (props: Props) => {
  const { debt, principal, interestRate } = props.loan

  return (
    <Box>
      {/* <Heading level="5" margin={{ bottom: 'medium' }}>
        Asset Details
      </Heading> */}
      <Box
        width="80%"
        direction="row"
        justify="between"
        gap="medium"
        pad="medium"
        elevation="small"
        round="xsmall"
        background="white"
      >
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
              <TableRow>
                <TableCell scope="row">Status</TableCell>
                <TableCell style={{ textAlign: 'end', float: 'right', height: '21px !important' }}>
                  <LoanLabel loan={props.loan} />
                </TableCell>
              </TableRow>
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
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  )
}

export default LoanData
