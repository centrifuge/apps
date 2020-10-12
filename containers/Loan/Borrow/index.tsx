import * as React from 'react'
import { Box, FormField, Button, Text } from 'grommet'
// import NumberInput from '../../../components/NumberInput'
import { baseToDisplay, displayToBase, Loan } from '@centrifuge/tinlake-js'
import { PoolState, loadPool, PoolDataV3 } from '../../../ducks/pool'
import { loadLoan } from '../../../ducks/loans'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import BN from 'bn.js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import { Decimal } from 'decimal.js-light'
import { TokenInput } from '@centrifuge/axis-token-input'

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
  }, [props.loan])

  React.useEffect(() => {
    props.loadPool && props.loadPool(props.tinlake)
  }, [])

  const [status, , setTxId] = useTransactionState()

  const borrow = async () => {
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(borrowAmount, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const txId = await props.createTransaction(`Finance Asset ${props.loan.loanId} (${formatted} DAI)`, 'borrow', [
      props.tinlake,
      props.loan,
      borrowAmount,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadLoan && props.loadLoan(props.tinlake, props.loan.loanId)
    }
  }, [status])

  const ceilingSet = props.loan.principal.toString() !== '0'
  const availableFunds = (props.pool && props.pool.data && props.pool.data.availableFunds) || '0'
  // const ceilingOverflow = new BN(borrowAmount).cmp(new BN(props.loan.principal)) > 0
  // const availableFundsOverflow = new BN(borrowAmount).cmp(new BN(availableFunds)) > 0
  const borrowedAlready = new BN(props.loan.debt).isZero() === false || props.loan.status !== 'opened'

  const epochState = props.pool?.data ? (props.pool?.data as PoolDataV3).epochState : undefined
  const isBlockedState =
    epochState === 'in-submission-period' ||
    epochState === 'in-challenge-period' ||
    epochState === 'challenge-period-ended'

  const [error, setError] = React.useState<string | undefined>(undefined)
  const borrowEnabled = error === undefined && ceilingSet && !borrowedAlready && !isBlockedState

  const onChange = (newValue: string) => {
    console.log('setBorrowAmount: newValue')
    if (newValue !== borrowAmount) setBorrowAmount(newValue)

    if (new BN(newValue).cmp(new BN(availableFunds)) > 0) {
      setError('Amount larger than available funds')
    } else if (new BN(newValue).cmp(new BN(props.loan.principal)) > 0) {
      setError('Amount larger than max financing amount')
    } else {
      setError(undefined)
    }
  }

  return (
    <Box basis={'1/3'} gap="medium" margin={{ right: 'small' }}>
      <Box gap="medium" margin={{ right: 'small' }}>
        <TokenInput
          token="DAI"
          label="Financing amount"
          value={borrowEnabled ? borrowAmount : '0'}
          error={error}
          onChange={onChange}
          disabled={status === 'unconfirmed' || status === 'pending'}
        />
      </Box>
      <Box align="start">
        <Button
          onClick={borrow}
          primary
          label="Finance Asset"
          disabled={!borrowEnabled || status === 'unconfirmed' || status === 'pending'}
        />
        {isBlockedState && (
          <Box margin={{ top: 'small' }}>
            The Epoch for this pool has just been closed and orders are currently being computed. Until the next Epoch
            opens, financing assets is not possible.
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadLoan, createTransaction, loadPool, ensureAuthed })(LoanBorrow)
