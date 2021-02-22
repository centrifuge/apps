import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import config, { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  tinlake: ITinlake
  updateTrancheData: () => void
}

const MinInvestment = new BN(config.network === 'Mainnet' ? 5000 : 10).mul(new BN(10).pow(new BN(18))) // 5k DAI

const InvestCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [daiValue, setDaiValue] = React.useState('0')

  const [limit, setLimit] = React.useState<string | undefined>(undefined)

  const router = useRouter()
  const disableLimit = 'disableLimit' in router.query

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const authProvider = useSelector<any, string | null>((state) => state.auth.providerName)
  const [hasInvested, setHasInvested] = React.useState<boolean | undefined>(undefined)

  const loadHasInvested = async () => {
    if (address) {
      setHasInvested(
        props.tranche === 'senior'
          ? await props.tinlake.checkHasInvestedInSenior(address)
          : await props.tinlake.checkHasInvestedInJunior(address)
      )
    }
  }

  const getLimit = async () => {
    if (address) {
      const balance = await props.tinlake.getCurrencyBalance(address)
      setLimit(balance.toString())
    }
  }

  React.useEffect(() => {
    loadHasInvested()
    getLimit()
  }, [props.tinlake.signer, address])

  const [status, , setTxId] = useTransactionState()

  const submit = async () => {
    const valueToDecimal = new Decimal(baseToDisplay(daiValue, 18)).toDecimalPlaces(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'submitSeniorSupplyOrder' : 'submitJuniorSupplyOrder'
    const skipSigning = authProvider !== 'MetaMask' // Ledger & Portis don't support EIP-712
    const txId = await props.createTransaction(`Lock ${formatted} DAI for ${token} investment`, method, [
      props.tinlake,
      daiValue,
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
    setDaiValue(newValue)
    if (disableLimit === false && hasInvested === false && new BN(newValue).lt(MinInvestment)) {
      setError(`Minimum investment: ${config.network === 'Mainnet' ? '10.000' : '10'} DAI`)
    } else if (limit && new BN(newValue).gt(new BN(limit))) {
      setError('Amount larger than balance')
    } else if (new BN(newValue).isZero()) {
      setError('')
    } else {
      setError(undefined)
    }
  }

  return (
    <Box>
      <Description margin={{ top: 'small' }}>
        Please set the amount of DAI you want to invest into {token} on Tinlake. Your DAI will be locked until the end
        of the epoch, at which point your order will be executed. You can collect your {token} in the next epoch.
      </Description>
      <TokenInput
        token="DAI"
        value={daiValue}
        error={error !== '' ? error : undefined}
        maxValue={limit}
        limitLabel="Your balance"
        onChange={onChange}
        disabled={disabled}
      />
      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button primary label="Lock DAI" onClick={submit} disabled={error !== undefined || disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(InvestCard)
