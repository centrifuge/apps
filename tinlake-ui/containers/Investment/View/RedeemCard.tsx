import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Heading } from 'grommet'
import * as React from 'react'
import { useQuery } from 'react-query'
import { connect, useSelector } from 'react-redux'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { RewardsWarning } from '../../../components/RewardsWarning'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useAddress } from '../../../utils/useAddress'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  selectedPool?: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  updateTrancheData: () => void
}

const RedeemCard: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const address = useAddress()
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [tokenValue, setTokenValue] = React.useState('0')

  const authProvider = useSelector<any, string | null>((state) => state.auth.providerName)
  const { data: limit } = useQuery(
    ['redeemLimit', props.tranche, address],
    async () => {
      const balance =
        props.tranche === 'senior'
          ? await tinlake.getSeniorTokenBalance(address!)
          : await tinlake.getJuniorTokenBalance(address!)
      return balance.toString()
    },
    {
      enabled: !!address,
    }
  )

  const [status, , setTxId] = useTransactionState()

  const submit = async () => {
    const valueToDecimal = new Decimal(baseToDisplay(tokenValue, 18)).toDecimalPlaces(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'submitSeniorRedeemOrder' : 'submitJuniorRedeemOrder'
    const skipSigning = authProvider !== 'MetaMask' // Ledger & Portis don't support EIP-712
    const txId = await props.createTransaction(`Lock ${formatted} ${token} for redemption`, method, [
      tinlake,
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
    <div>
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
      {props.tranche === 'senior' && <RewardsWarning mt="medium" bleedX="medium" />}
      <ButtonGroup mt="medium">
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label="Redeem" onClick={submit} disabled={error !== undefined || disabled} />
      </ButtonGroup>
    </div>
  )
}

export default connect((state) => state, { createTransaction })(RedeemCard)
