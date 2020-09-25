import * as React from 'react'
import { Box, Button } from 'grommet'
import { TokenInput } from '@centrifuge/axis-token-input'
import { Pool } from '../../../../config'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { ITinlake as ITinlakeV3, baseToDisplay } from '@centrifuge/tinlake-js-v3'
import { connect } from 'react-redux'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'

import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  tinlake: ITinlakeV3
  updateTrancheData: () => void
}

const InvestCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [daiValue, setDaiValue] = React.useState('0')

  const [limit, setLimit] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    async function getLimit() {
      const user = await props.tinlake.signer?.getAddress()
      if (user) {
        const balance = await props.tinlake.getCurrencyBalance(user)
        setLimit(balance.toString())
      }
    }
    getLimit()
  }, [props.tinlake])

  const [status, , setTxId] = useTransactionState()

  const submit = async () => {
    const valueToDecimal = new Decimal(baseToDisplay(daiValue, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'submitSeniorSupplyOrder' : 'submitJuniorSupplyOrder'
    const txId = await props.createTransaction(`${token} Invest ${formatted} DAI`, method, [props.tinlake, daiValue])
    setTxId(txId)
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
        Please set the amount of DAI you want to invest into {token} on Tinlake. Your DAI will be locked until the end
        of the epoch, at which point your order will be executed. You can collect your {token} in the next epoch.
      </Description>

      <TokenInput
        token="DAI"
        value={daiValue}
        maxValue={limit}
        limitLabel="Your balance"
        onChange={(newValue: string) => setDaiValue(newValue)}
        disabled={disabled}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label="Lock DAI" onClick={submit} disabled={disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(InvestCard)
