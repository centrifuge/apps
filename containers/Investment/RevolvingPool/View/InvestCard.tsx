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
}

const InvestCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [daiValue, setDaiValue] = React.useState('0')

  const [status, result, setTxId] = useTransactionState()

  const submit = async () => {
    const txId = await props.createTransaction(`${token} Invest`, 'submitSeniorSupplyOrder', [props.tinlake, daiValue])
    setTxId(txId)
  }

  React.useEffect(() => {
    console.log(status)
    console.log(result)
  }, [status])

  return (
    <Box>
      <Description margin={{ top: 'medium' }}>
        Please set the amount of DAI you want to invest into {token} on Tinlake. Your DAI will be locked until the end
        of the epoch, at which point your order will be executed. You can collect your {token} in the next epoch.
      </Description>

      <TokenInput
        token="DAI"
        value={daiValue}
        maxValue="1230000000000000000"
        onChange={(newValue: string) => setDaiValue(newValue)}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} />
        <Button primary label="Lock DAI" onClick={() => submit()} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(InvestCard)
