import * as React from 'react'
import { Box, FormField, Button, Text } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { TrancheType } from '../../../services/tinlake/actions'
import { baseToDisplay, displayToBase, Investor, Tranche } from 'tinlake'
import { loadInvestor } from '../../../ducks/investments'
import { loadPool } from '../../../ducks/pool'
import { connect } from 'react-redux'
import BN from 'bn.js'
import { ensureAuthed } from '../../../ducks/auth'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/asyncTransactions'

interface Props extends TransactionProps {
  investor: Investor
  tinlake: any
  setErrorMsg: (errorMsg: string) => void
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  tranche: Tranche
  ensureAuthed?: () => Promise<void>
}

const InvestorRedeem: React.FC<Props> = (props: Props) => {
  const [redeemAmount, setRedeemAmount] = React.useState('0')

  const [status, result, setTxId] = useTransactionState()

  const redeem = async () => {
    await ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(redeemAmount, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const txId = await props.createTransaction(`Redeem ${formatted} ${props.tranche.token}`, 'redeem', [
      props.tinlake,
      redeemAmount,
      (props.tranche.type as any) as TrancheType,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      loadInvestor && loadInvestor(props.tinlake, props.investor.address)
      loadPool && loadPool(props.tinlake)
    }

    if (result?.errorMsg) props.setErrorMsg(result.errorMsg)
  }, [status, result])

  const trancheValues = props.investor[(props.tranche.type as any) as TrancheType]
  const maxRedeemAmount = trancheValues.maxRedeem || '0'
  const tokenBalance = trancheValues.tokenBalance || '0'
  const redeemLimitSet = maxRedeemAmount.toString() !== '0'
  const limitOverflow = new BN(redeemAmount).cmp(new BN(maxRedeemAmount)) > 0
  const availableTokensOverflow = new BN(redeemAmount).cmp(new BN(tokenBalance)) > 0
  const redeemEnabled =
    redeemLimitSet && !limitOverflow && !availableTokensOverflow && !(status === 'unconfirmed' || status === 'pending')

  return (
    <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Redeem amount">
          <NumberInput
            value={baseToDisplay(redeemAmount, 18)}
            suffix={` ${props.tranche.token}`}
            precision={18}
            onValueChange={({ value }) => setRedeemAmount(displayToBase(value, 18))}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={redeem} primary label="Redeem" disabled={!redeemEnabled} />

        {limitOverflow && !availableTokensOverflow && (
          <Box margin={{ top: 'small' }}>
            Max redeem amount exceeded. <br />
            Amount has to be lower then <br />
            <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(maxRedeemAmount, 18))}`}</Text>
          </Box>
        )}

        {availableTokensOverflow && (
          <Box margin={{ top: 'small' }}>
            Available token amount exceeded. <br />
            Amount has to be lower then <br />
            <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(tokenBalance, 18))}`}</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, {
  loadInvestor,
  loadPool,
  createTransaction,
  ensureAuthed,
})(InvestorRedeem)
