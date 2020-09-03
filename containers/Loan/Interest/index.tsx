import * as React from 'react'
import { Box, FormField, Button } from 'grommet'
import { feeToInterestRate, Loan } from '@centrifuge/tinlake-js'
import NumberInput from '../../../components/NumberInput'
import { loadLoan } from '../../../ducks/loans'
import { connect } from 'react-redux'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'

interface Props extends TransactionProps {
  loan: Loan
  tinlake: any
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
}

const LoanInterest: React.FC<Props> = (props: Props) => {
  const [interestRate, setInterestRate] = React.useState('')

  React.useEffect(() => {
    setInterestRate(feeToInterestRate(props.loan.interestRate))
  }, [props])

  const [status, , setTxId] = useTransactionState()

  const setInterestRateAction = async () => {
    const txId = await props.createTransaction(`Set interest rate for asset`, 'setInterest', [
      props.tinlake,
      props.loan.loanId,
      props.loan.debt.toString(),
      interestRate,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadLoan && props.loadLoan(props.tinlake, props.loan.loanId)
    }
  }, [status])

  return (
    <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Interest rate">
          <NumberInput value={interestRate} suffix=" %" onValueChange={({ value }) => setInterestRate(value)} />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={setInterestRateAction} primary label="Set interest rate" />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadLoan, createTransaction })(LoanInterest)
