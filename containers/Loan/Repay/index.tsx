import * as React from 'react'
import { Box, FormField, Button } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { baseToDisplay, displayToBase, Loan } from 'tinlake'
import { loadLoan } from '../../../ducks/loans'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

interface Props extends TransactionProps {
  loan: Loan
  tinlake: any
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const LoanRepay: React.FC<Props> = (props: Props) => {
  const [repayAmount, setRepayAmount] = React.useState('0')

  React.useEffect(() => {
    setRepayAmount((props.loan.debt && props.loan.debt.toString()) || '0')
  }, [props])

  const [status, , setTxId] = useTransactionState()

  const repay = async () => {
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(repayAmount, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const txId = await props.createTransaction(`Repay ${formatted} DAI`, 'repay', [props.tinlake, props.loan])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadLoan && props.loadLoan(props.tinlake, props.loan.loanId)
    }
  }, [status])

  const hasDebt = props.loan.debt.toString() !== '0'

  return (
    <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Repay amount">
          <NumberInput
            value={baseToDisplay(repayAmount, 18)}
            suffix=" DAI"
            precision={18}
            onValueChange={({ value }) => setRepayAmount(displayToBase(value, 18))}
            disabled
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button
          onClick={repay}
          primary
          label="Repay"
          disabled={!hasDebt || status === 'unconfirmed' || status === 'pending'}
        />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadLoan, createTransaction, ensureAuthed })(LoanRepay)
