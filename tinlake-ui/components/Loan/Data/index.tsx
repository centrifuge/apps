import * as React from 'react'
import { Box, Heading, Button, Table, TableBody, TableRow, TableCell } from 'grommet'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Loan } from '@centrifuge/tinlake-js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import NftData from '../../../components/NftData'
import { AuthState } from '../../../ducks/auth'

interface Props {
  loan: Loan
  auth?: AuthState
}

const dateToYMD = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US')
}

class LoanData extends React.Component<Props> {
  render() {
    const { loanId, debt, principal, interestRate, status } = this.props.loan
    return (
      <Box direction="row" justify="between">
        <Box width="420px" pad="medium" elevation="small" round="xsmall" background="white">
          <Box>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Asset {loanId}
              </Heading>
            </Box>

            <Table margin={{ bottom: 'medium' }}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Status</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{status}</TableCell>
                </TableRow>
                {this.props.loan.nft && (this.props.loan.nft as any).maturityDate && (
                  <TableRow>
                    <TableCell scope="row">Maturity date</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {dateToYMD((this.props.loan.nft as any).maturityDate)}
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
              <Button primary label="Finance Asset" />
              <Button primary label="Repay" disabled />
            </Box>
          </Box>
          {/* <Box direction="row" gap="medium">
            <FormField label="Asset ID">
              <TextInput value={loanId} disabled />
            </FormField>
            <FormField label="Status">
              <TextInput value={status} disabled />
            </FormField>
          </Box>

          <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
            <Box basis={'1/3'} gap="medium">
              <FormField label="Available for Financing">
                <NumberInput value={baseToDisplay(principal, 18)} suffix=" DAI" disabled precision={18} />
              </FormField>
            </Box>
            <Box basis={'1/3'} gap="medium">
              <FormField label="Outstanding">
                <NumberInput value={baseToDisplay(debt, 18)} suffix=" DAI" precision={18} disabled />
              </FormField>
            </Box>
            {this.props.loan.nft && (this.props.loan.nft as any).maturityDate && (
              <Box basis={'1/3'} gap="medium">
                <FormField label="Maturity Date">
                  <TextInput value={dateToYMD((this.props.loan.nft as any).maturityDate)} disabled />
                </FormField>
              </Box>
            )} */}
          {/* </Box> */}
        </Box>
        <Box basis="1/3">
          {console.log(this.props.loan)}
          {this.props.loan && (this.props.loan as any).riskGroup !== undefined && (this.props.loan as any).scoreCard && (
            <Box>
              <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
                <Heading level="5" margin={'0'}>
                  Score Card
                </Heading>
              </Box>

              <Table margin={{ bottom: 'small' }}>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Risk group</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>{(this.props.loan as any).riskGroup}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Advance rate</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(
                        toPrecision(baseToDisplay((this.props.loan as any).scoreCard.ceilingRatio, 25), 2)
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
                        toPrecision(baseToDisplay((this.props.loan as any).scoreCard.recoveryRatePD, 25), 2)
                      )}{' '}
                      %
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}

          {this.props.loan && this.props.loan.nft && this.props.auth?.address && (
            <NftData data={this.props.loan.nft} authedAddr={this.props.auth.address} />
          )}
        </Box>
      </Box>
    )
  }
}

export default LoanData
