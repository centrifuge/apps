import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { loadLoan } from '../../../ducks/loans'
import { loadPool, PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

interface Props extends TransactionProps {
  loan: Loan
  tinlake: any
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  pool?: PoolState
  ensureAuthed?: () => Promise<void>
}

const LoanBorrow: React.FC<Props> = (props: Props) => {
  const [borrowAmount, setBorrowAmount] = React.useState<string>('')

  React.useEffect(() => {
    props.loadPool && props.loadPool(props.tinlake)
  }, [])

  const [status, , setTxId] = useTransactionState()

  const borrow = async () => {
    if (!borrowAmount || error) return
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(borrowAmount, 18)).toFixed(4)
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
  const availableFunds = (props.pool && props.pool.data && props.pool.data.availableFunds.toString()) || '0'
  const borrowedAlready = new BN(props.loan.debt).isZero() === false || props.loan.status !== 'NFT locked'

  const isBlockedState = props.pool ? props.pool?.epoch?.isBlockedState : false

  const [error, setError] = React.useState<string | undefined>(undefined)
  const borrowEnabled = ceilingSet && !borrowedAlready && !isBlockedState

  React.useEffect(() => {
    if (!borrowEnabled && borrowAmount === '') setBorrowAmount('0')
    if (borrowAmount === '') {
      if (props.loan.principal.lt(new BN(availableFunds))) {
        setBorrowAmount(props.loan.principal.toString())
        validate(props.loan.principal.toString())
      } else {
        setBorrowAmount(availableFunds)
        validate(availableFunds)
      }
    }
  }, [props.loan.principal])

  React.useEffect(() => {
    validate(borrowAmount)
  }, [availableFunds])

  const onChange = (newValue: string) => {
    if (!borrowAmount || new BN(newValue).cmp(new BN(borrowAmount)) !== 0) {
      setBorrowAmount(newValue)
    }

    validate(newValue)
  }

  const validate = (value: string) => {
    if (new BN(value).gt(new BN(availableFunds))) {
      setError('Amount larger than available funds')
    } else if (new BN(value).gt(new BN(props.loan.principal))) {
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
          value={borrowAmount}
          error={error}
          maxValue={
            new BN(availableFunds).gt(props.loan.principal)
              ? props.loan.principal.toString()
              : availableFunds.toString()
          }
          limitLabel={new BN(availableFunds).gt(props.loan.principal) ? 'Max financing amount' : 'Available funds'}
          onChange={(newValue: string) => onChange(newValue)}
          disabled={!borrowEnabled || status === 'unconfirmed' || status === 'pending'}
        />
      </Box>
      <Box align="start">
        <Button
          onClick={borrow}
          primary
          label="Finance Asset"
          disabled={
            error !== undefined ||
            new BN(borrowAmount).isZero() ||
            !borrowEnabled ||
            status === 'unconfirmed' ||
            status === 'pending'
          }
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
