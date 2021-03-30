import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  selectedPool?: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  tinlake: ITinlake
  updateTrancheData: () => void
}

const RedeemCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [tokenValue, setTokenValue] = React.useState('0')

  const authProvider = useSelector<any, string | null>((state) => state.auth.providerName)
  const [limit, setLimit] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    async function getLimit() {
      const user = await props.tinlake.signer?.getAddress()
      if (user) {
        // TODO: get token balance
        const balance =
          props.tranche === 'senior'
            ? await props.tinlake.getSeniorTokenBalance(user)
            : await props.tinlake.getJuniorTokenBalance(user)
        setLimit(balance.toString())
      }
    }
    getLimit()
  }, [props.tinlake])

  const [status, , setTxId] = useTransactionState()

  const submit = async () => {
    const valueToDecimal = new Decimal(baseToDisplay(tokenValue, 18)).toDecimalPlaces(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'submitSeniorRedeemOrder' : 'submitJuniorRedeemOrder'
    const skipSigning = authProvider !== 'MetaMask' // Ledger & Portis don't support EIP-712
    const txId = await props.createTransaction(`Lock ${formatted} ${token} for redemption`, method, [
      props.tinlake,
      tokenValue,
      skipSigning,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled = status === 'unconfirmed' || status === 'pending'

  const [error, setError] = React.useState<string | undefined>(undefined)

  const onChange = (newValue: string) => {
    setTokenValue(newValue)
    if (limit && new BN(newValue).gt(new BN(limit))) {
      setError('Amount larger than balance')
    } else if (new BN(newValue).isZero()) {
      setError('')
    } else {
      setError(undefined)
    }
  }
  return (
    <Box>
      <Heading level="6" margin={{ top: 'medium', bottom: 'xsmall' }}>
        Enter your redemption amount below
      </Heading>
      <TokenInput
        token={token}
        value={tokenValue}
        error={error !== '' ? error : undefined}
        maxValue={limit}
        limitLabel="Your balance"
        onChange={onChange}
        disabled={disabled}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label={'Redeem'} onClick={submit} disabled={error !== undefined || disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(RedeemCard)
