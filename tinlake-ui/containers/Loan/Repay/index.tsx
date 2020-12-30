import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, ITinlake, Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { loadLoan } from '../../../ducks/loans'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

interface Props extends TransactionProps {
  loan: Loan
  tinlake: ITinlake
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

  const [balance, setBalance] = React.useState('')

  const address = useSelector<any, string | null>((state) => state.auth.address)

  React.useEffect(() => {
    ;(async () => {
      if (!address) {
        return
      }

      const balance = await props.tinlake.getCurrencyBalance(address)
      setBalance(balance.toString())
    })()
  }, [address])

  const useBalanceAsMax = new BN(balance).lt(new BN(debt))

  React.useEffect(() => {
    if (balance === '' || repayAmount !== '') {
      return
    }
    const newRepayAmount = useBalanceAsMax ? balance : debt.toString()
    setRepayAmount(newRepayAmount)
    validate(newRepayAmount)
  }, [debt, balance])

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
    } else if (new BN(value).gt(new BN(balance))) {
      setError('Amount larger than your balance')
    } else {
      setError(undefined)
    }
  }

  return (
    <Box width="360px" gap="medium">
      <Box gap="medium" margin={{ right: 'small' }}>
        <TokenInput
          token="DAI"
          label="Repay amount"
          value={repayAmount}
          maxValue={useBalanceAsMax ? balance : debt}
          limitLabel={useBalanceAsMax ? 'Your balance' : 'Outstanding'}
          error={error}
          onChange={onChange}
          disabled={status === 'unconfirmed' || status === 'pending'}
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
