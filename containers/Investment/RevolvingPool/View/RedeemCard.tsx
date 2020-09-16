import * as React from 'react'
import { Box, Button } from 'grommet'
import { TokenInput } from '@centrifuge/axis-token-input'
import { Pool } from '../../../../config'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { connect } from 'react-redux'

import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  tinlake: ITinlakeV3
  updateTrancheData: () => void
}

const RedeemCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [tokenValue, setTokenValue] = React.useState('0')

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
    console.log('tokenValue', tokenValue)
    // const method = props.tranche === 'senior' ? 'submitSeniorSupplyOrder' : 'submitJuniorSupplyOrder'
    // const txId = await props.createTransaction(`${token} Invest`, method, [props.tinlake, tokenValue])
    // setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled = status === 'unconfirmed' || status === 'pending'

  return (
    <Box>
      <Description margin={{ top: 'medium' }}>
        Please set the amount of {token} you want to redeem from Tinlake. Your {token} will be locked until the end of
        the epoch, at which point your order will be executed. You can withdraw your DAI in the next epoch.{' '}
      </Description>

      <TokenInput
        token={token}
        value={tokenValue}
        maxValue={limit}
        onChange={(newValue: string) => setTokenValue(newValue)}
        disabled={disabled}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label={`Lock ${token}`} onClick={submit} disabled={disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(RedeemCard)
