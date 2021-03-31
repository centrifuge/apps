import { TokenInput } from '@centrifuge/axis-token-input'
import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import config, { Pool } from '../../../config'
import { PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { Warning } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  selectedPool?: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  tinlake: ITinlake
  updateTrancheData: () => void
}

const MinInvestment = new BN(config.network === 'Mainnet' ? 5000 : 10).mul(new BN(10).pow(new BN(18))) // 5k DAI
const OversubscribedBuffer = new BN(5000).mul(new BN(10).pow(new BN(18))) // 5k DAI

const InvestCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [daiValue, setDaiValue] = React.useState('0')

  const [limit, setLimit] = React.useState<string | undefined>(undefined)

  const router = useRouter()
  const disableLimit = 'disableLimit' in router.query

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const authProvider = useSelector<any, string | null>((state) => state.auth.providerName)
  const [hasInvested, setHasInvested] = React.useState<boolean | undefined>(undefined)

  const pool = useSelector<any, PoolState>((state) => state.pool)
  const isOversubscribed =
    (pool?.data && new BN(pool?.data.maxReserve).lte(new BN(pool?.data.reserve).add(OversubscribedBuffer))) || false

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
    const txId = await props.createTransaction(
      `Lock ${formatted} ${props.selectedPool?.metadata.currencySymbol || 'DAI'} for ${token} investment`,
      method,
      [props.tinlake, daiValue, skipSigning]
    )
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
      setError(
        `Minimum investment: ${config.network === 'Mainnet' ? '5.000' : '10'} ${props.selectedPool?.metadata
          .currencySymbol || 'DAI'}`
      )
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
      <Heading level="6" margin={{ top: 'medium', bottom: 'xsmall' }}>
        Enter your investment amount below
      </Heading>
      <TokenInput
        token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
        value={daiValue}
        error={error !== '' ? error : undefined}
        maxValue={limit}
        limitLabel="Your balance"
        onChange={onChange}
        disabled={disabled}
      />
      {isOversubscribed && (
        <Warning>
          <Heading level="6" margin={{ top: 'small', bottom: 'xsmall' }}>
            Pool is currently oversubscribed
          </Heading>
          Your locked investment order may be pending until the pool opens again for investments. You will only earn CFG
          rewards once your order has been executed.
        </Warning>
      )}
      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} disabled={disabled} />
        <Button
          primary
          label={`Lock ${props.selectedPool?.metadata.currencySymbol || 'DAI'}`}
          onClick={submit}
          disabled={error !== undefined || disabled}
        />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(InvestCard)
