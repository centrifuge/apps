import * as React from 'react'
import { Box, FormField, Button, Text } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { baseToDisplay, displayToBase, Loan } from 'tinlake'
import { PoolState, loadPool } from '../../../ducks/pool'
import { loadLoan } from '../../../ducks/loans'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import BN from 'bn.js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/asyncTransactions'
import { Decimal } from 'decimal.js-light'

interface Props extends TransactionProps {
  loan: Loan
  tinlake: any
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  pool?: PoolState
  ensureAuthed?: () => Promise<void>
}

const LoanBorrow: React.FC<Props> = (props: Props) => {
  const [borrowAmount, setBorrowAmount] = React.useState('0')

  React.useEffect(() => {
    setBorrowAmount((props.loan.principal && props.loan.principal.toString()) || '0')
    loadPool && loadPool(props.tinlake)
  }, [props])

  const [status, , setTxId] = useTransactionState()

  const borrow = async () => {
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(borrowAmount, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const txId = await props.createTransaction(`Borrow ${formatted} DAI`, 'borrow', [
      props.tinlake,
      props.loan,
      borrowAmount,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadLoan && props.loadLoan(props.tinlake, loan.loanId)
    }
  }, [status])

  const { loan, pool } = props

  const ceilingSet = loan.principal.toString() !== '0'
  const availableFunds = (pool && pool.data && pool.data.availableFunds) || '0'
  const ceilingOverflow = new BN(borrowAmount).cmp(new BN(loan.principal)) > 0
  const availableFundsOverflow = new BN(borrowAmount).cmp(new BN(availableFunds)) > 0
  const borrowEnabled = !ceilingOverflow && !availableFundsOverflow && ceilingSet
  return (
    <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Financing amount">
          <NumberInput
            value={baseToDisplay(borrowAmount, 18)}
            suffix=" DAI"
            precision={18}
            onValueChange={({ value }) => setBorrowAmount(displayToBase(value, 18))}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={borrow} primary label="Finance Asset" disabled={!borrowEnabled} />
        {availableFundsOverflow && (
          <Box margin={{ top: 'small' }}>
            Available funds exceeded. <br />
            Amount has to be lower then <br />
            <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(availableFunds, 18))}`}</Text>
          </Box>
        )}
        {ceilingOverflow && !availableFundsOverflow && (
          <Box margin={{ top: 'small' }}>
            Max financing amount exceeded. <br />
            Amount has to be lower than <br />
            <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(loan.principal, 18))}`}</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadLoan, createTransaction, loadPool, ensureAuthed })(LoanBorrow)
