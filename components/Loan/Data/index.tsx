import * as React from 'react'
import { Box, FormField, TextInput } from 'grommet'
import { baseToDisplay, feeToInterestRate, Loan } from '@centrifuge/tinlake-js'
import NumberInput from '../../NumberInput'

interface Props {
  loan: Loan
}

const dateToYMD = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US')
}

class LoanData extends React.Component<Props> {
  render() {
    const { loanId, debt, principal, interestRate, status } = this.props.loan
    return (
      <Box>
        <Box direction="row" gap="medium">
          <FormField label="Asset ID">
            <TextInput value={loanId} disabled />
          </FormField>
          <FormField label="Status">
            <TextInput value={status} disabled />
          </FormField>
          {(this.props.loan as any).riskGroup && (
            <FormField label="Risk group">
              <TextInput value={(this.props.loan as any).riskGroup} disabled />
            </FormField>
          )}
        </Box>

        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Available for Financing">
              <NumberInput value={baseToDisplay(principal, 18)} suffix=" DAI" disabled precision={18} />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Outstanding">
              <NumberInput value={baseToDisplay(debt, 18)} suffix=" DAI" precision={18} disabled />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Financing Fee">
              <NumberInput value={feeToInterestRate(interestRate)} suffix="%" disabled />
            </FormField>
          </Box>
          {this.props.loan.nft && (this.props.loan.nft as any).maturityDate && (
            <Box basis={'1/4'} gap="medium">
              <FormField label="Maturity Date">
                <TextInput value={dateToYMD((this.props.loan.nft as any).maturityDate)} disabled />
              </FormField>
            </Box>
          )}
        </Box>
      </Box>
    )
  }
}

export default LoanData
