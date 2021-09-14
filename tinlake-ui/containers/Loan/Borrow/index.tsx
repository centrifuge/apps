import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Asset } from '../../../utils/useAsset'
import { useEpoch } from '../../../utils/useEpoch'
import { usePool } from '../../../utils/usePool'

interface Props extends TransactionProps {
  loan: Asset
  refetch: () => void
  poolConfig: Pool
  ensureAuthed: () => Promise<void>
}

const LoanBorrow: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: epochData } = useEpoch()
  const [borrowAmount, setBorrowAmount] = React.useState<string>('')

  const router = useRouter()
  const allowMultipleBorrow = 'allowMultipleBorrow' in router.query

  const [status, , setTxId] = useTransactionState()

  const borrow = async () => {
    if (!borrowAmount || error) return
    await props.ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(borrowAmount, 18)).toFixed(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const action =
      new BN(props.loan.debt).isZero() === false || props.loan.status !== 'NFT locked'
        ? 'borrowWithdraw'
        : 'lockBorrowWithdraw'

    const txId = await props.createTransaction(
      `Finance Asset ${props.loan.loanId} (${formatted} ${props.poolConfig.metadata.currencySymbol || 'DAI'})`,
      action,
      [tinlake, props.loan, borrowAmount]
    )
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.refetch()
    }
  }, [status])

  const [closeStatus, , setCloseTxId] = useTransactionState()

  const close = async () => {
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Close Asset ${props.loan.loanId}`, 'close', [tinlake, props.loan])
    setCloseTxId(txId)
  }

  React.useEffect(() => {
    if (closeStatus === 'succeeded') {
      props.refetch()
    }
  }, [closeStatus])

  const ceilingSet = props.loan.principal.toString() !== '0'
  const availableFunds = (poolData && poolData.availableFunds.toString()) || '0'
  const borrowedAlready =
    !allowMultipleBorrow && (new BN(props.loan.debt).isZero() === false || props.loan.status !== 'NFT locked')

  const isBlockedState = epochData ? epochData.isBlockedState : false

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
    <Box width="360px" gap="medium">
      <Box gap="medium" margin={{ right: 'small' }}>
        <TokenInput
          token={props.poolConfig.metadata.currencySymbol || 'DAI'}
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
        <Box direction="row" gap="small">
          {epochData && borrowEnabled && (
            <Button
              onClick={borrow}
              primary
              label="Finance Asset"
              disabled={
                new BN(borrowAmount).isZero() || error !== undefined || status === 'unconfirmed' || status === 'pending'
              }
            />
          )}
          {props.loan.status === 'NFT locked' && (
            <Button
              onClick={close}
              secondary
              label="Unlock NFT"
              disabled={status === 'unconfirmed' || status === 'pending'}
            />
          )}
        </Box>
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

export default connect(null, { createTransaction, ensureAuthed })(LoanBorrow)
