import * as React from 'react'
import { Box, Button } from 'grommet'
import { baseToDisplay, Loan } from '@centrifuge/tinlake-js'
import { loadLoan } from '../../../ducks/loans'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Pool } from '../../../config'
import BN from 'bn.js'
import { TokenInput } from '@centrifuge/axis-token-input'

interface Props extends TransactionProps {
  poolConfig: Pool
  loan: Loan
  tinlake: any
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const LoanRepay: React.FC<Props> = (props: Props) => {
  const [repayAmount, setRepayAmount] = React.useState<string>('')
  const debt = props.loan.debt?.toString() || '0'

  const [status, , setTxId] = useTransactionState()

  const repay = async () => {
    if (!repayAmount) return
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(repayAmount, 18)).toFixed(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    let txId: string
    if (repayAmount === debt) {
      // full repay
      txId = await props.createTransaction(`Repay Asset ${props.loan.loanId} (${formatted} DAI)`, 'repayFull', [
        props.tinlake,
        props.loan,
      ])
    } else {
      // partial repay
      txId = await props.createTransaction(`Repay Asset ${props.loan.loanId} (${formatted} DAI)`, 'repay', [
        props.tinlake,
        props.loan,
        repayAmount,
      ])
    }

    setTxId(txId)
  }

  React.useEffect(() => {
    if (repayAmount === '') setRepayAmount(debt.toString())
    validate(debt.toString())
  }, [debt])

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadLoan && props.loadLoan(props.tinlake, props.loan.loanId)
    }
  }, [status])

  const hasDebt = debt !== '0'

  const [error, setError] = React.useState<string | undefined>(undefined)

  const onChange = (newValue: string) => {
    if (!repayAmount || new BN(newValue).cmp(new BN(repayAmount)) !== 0) setRepayAmount(newValue)
    validate(newValue)
  }

  const validate = (value: string) => {
    if (new BN(value).gt(new BN(debt))) {
      setError('Amount larger than outstanding')
    } else {
      setError(undefined)
    }
  }

  return (
    <Box basis={'1/3'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium" margin={{ right: 'small' }}>
        <TokenInput
          token="DAI"
          label="Repay amount"
          value={repayAmount}
          maxValue={debt}
          limitLabel="Outstanding"
          error={error}
          onChange={onChange}
          disabled={!props.poolConfig.contractConfig?.partialRepay || status === 'unconfirmed' || status === 'pending'}
        />
      </Box>
      <Box align="start">
        <Button
          onClick={repay}
          primary
          label="Repay"
          disabled={
            !hasDebt ||
            new BN(repayAmount).isZero() ||
            error !== undefined ||
            status === 'unconfirmed' ||
            status === 'pending'
          }
        />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadLoan, createTransaction, ensureAuthed })(LoanRepay)
