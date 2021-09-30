import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Heading } from 'grommet'
import { CircleAlert } from 'grommet-icons'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useEthLink } from '../../../utils/useEthLink'
import { Warning } from './styles'
import { Card } from './TrancheOverview'

const LinkingAlert = styled(CircleAlert)`
  height: 16px;
  width: 16px;
  vertical-align: text-top;
`

const HelpTitle = styled.span`
  margin-bottom: 20px;
  padding-left: 6px;
  font-weight: 800;
`

const HelpText = styled.div`
  padding-top: 8px;
`

interface Props extends TransactionProps {
  selectedPool?: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  updateTrancheData: () => void
}

const RedeemCard: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: ethLink } = useEthLink()
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [tokenValue, setTokenValue] = React.useState('0')

  const authProvider = useSelector<any, string | null>((state) => state.auth.providerName)
  const [limit, setLimit] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    async function getLimit() {
      const user = await tinlake.signer?.getAddress()
      if (user) {
        // TODO: get token balance
        const balance =
          props.tranche === 'senior'
            ? await tinlake.getSeniorTokenBalance(user)
            : await tinlake.getJuniorTokenBalance(user)
        setLimit(balance.toString())
      }
    }
    getLimit()
  }, [tinlake])

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
      {ethLink === null && (
        <Warning>
          <LinkingAlert />
          <HelpTitle>No Centrifuge Chain Account Linked</HelpTitle>
          <HelpText>To claim rewards, link your Centrifuge Chain account before redeeming your investment</HelpText>
        </Warning>
      )}
      <ButtonGroup mt="medium">
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label="Redeem" onClick={submit} disabled={error !== undefined || disabled} />
      </ButtonGroup>
    </div>
  )
}

export default connect((state) => state, { createTransaction })(RedeemCard)
