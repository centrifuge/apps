import * as React from 'react'
import { Box, Heading, Button, Table, TableBody, TableRow, TableCell } from 'grommet'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Loan } from '@centrifuge/tinlake-js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import NftData from '../../../components/NftData'
import { AuthState } from '../../../ducks/auth'
import LoanBorrow from '../../../containers/Loan/Borrow'
import { ITinlake } from '@centrifuge/tinlake-js'
import { dateToYMD } from '../../../utils/date'

interface Props {
  loan: Loan
  tinlake: ITinlake
  auth?: AuthState
}

type Card = 'data' | 'borrow' | 'repay'

const LoanData: React.FC<Props> = (props: Props) => {
  const [card, setCard] = React.useState<Card>('data')

  const { debt, principal, interestRate, status } = props.loan

  return (
    <Box direction="row" justify="between">
      <Box>
        <Box width="420px" pad="medium" elevation="small" round="xsmall" background="white">
          {card === 'data' && (
            <Box>
              <Table margin={{ bottom: 'medium' }}>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Status</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>{status}</TableCell>
                  </TableRow>
                  {props.loan.nft && (props.loan.nft as any).maturityDate && (
                    <TableRow>
                      <TableCell scope="row">Maturity date</TableCell>
                      <TableCell style={{ textAlign: 'end' }}>
                        {dateToYMD((props.loan.nft as any).maturityDate)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Table margin={{ bottom: 'small' }}>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Available for Financing</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(principal, 18), 2))} DAI
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row" border={{ color: 'transparent' }}>
                      Outstanding
                    </TableCell>
                    <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(debt, 18), 2))} DAI
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
                <Button primary label="Finance Asset" onClick={() => setCard('borrow')} />
                <Button primary label="Repay" onClick={() => setCard('repay')} disabled />
              </Box>
            </Box>
          )}
          {card === 'borrow' && <LoanBorrow loan={props.loan} tinlake={props.tinlake} />}
        </Box>
      </Box>
      <Box basis="1/3">
        {/* {props.loan && (props.loan as any).riskGroup !== undefined && (props.loan as any).scoreCard && (
          <Box margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Score Card
              </Heading>
            </Box>

            <Table margin={{ bottom: 'small' }}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Risk group</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{(props.loan as any).riskGroup}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Advance rate</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay((props.loan as any).scoreCard.ceilingRatio, 25), 2)
                    )}{' '}
                    %
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Financing fee</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {toPrecision(feeToInterestRate(interestRate), 2)} %
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Recovery rate</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {addThousandsSeparators(
                      toPrecision(baseToDisplay((props.loan as any).scoreCard.recoveryRatePD, 25), 2)
                    )}{' '}
                    %
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )} */}

        {props.loan && props.loan.nft && props.auth?.address && (
          <NftData data={props.loan.nft} authedAddr={props.auth.address} />
        )}
      </Box>
    </Box>
  )
}

export default LoanData
