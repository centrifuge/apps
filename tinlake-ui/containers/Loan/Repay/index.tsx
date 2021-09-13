import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Asset } from '../../../utils/useAsset'

interface Props extends TransactionProps {
  loan: Asset
  refetch: () => void
  poolConfig: Pool
  ensureAuthed?: () => Promise<void>
}

const LoanRepay: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
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
      txId = await props.createTransaction(
        `Repay Asset ${props.loan.loanId} (${formatted} ${props.poolConfig.metadata.currencySymbol || 'DAI'})`,
        'repayFull',
        [tinlake, props.loan]
      )
    } else {
      // partial repay
      txId = await props.createTransaction(
        `Repay Asset ${props.loan.loanId} (${formatted} ${props.poolConfig.metadata.currencySymbol || 'DAI'})`,
        'repay',
        [tinlake, props.loan, repayAmount]
      )
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

      const balance = await tinlake.getCurrencyBalance(address)
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
      props.refetch()
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
          token={props.poolConfig.metadata.currencySymbol || 'DAI'}
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
        {hasDebt && (
          <Button
            onClick={repay}
            primary
            label="Repay"
            disabled={
              new BN(repayAmount).isZero() || error !== undefined || status === 'unconfirmed' || status === 'pending'
            }
          />
        )}
      </Box>
    </Box>
  )
}

export default connect(null, { createTransaction, ensureAuthed })(LoanRepay)
