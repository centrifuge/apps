import { TokenInput } from '@centrifuge/axis-token-input'
import { addThousandsSeparators, baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { Pool } from '../../../config'
import { loadPool, PoolData, PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { Description } from './styles'

interface Props extends TransactionProps {
  tinlake: ITinlake
  selectedPool?: Pool
  loadPool?: (tinlake: any) => Promise<void>
  setShowMaxReserveForm: (value: boolean) => void
}

const MaxReserveForm: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const [value, setValue] = React.useState<string | undefined>(undefined)

  const onChange = (newValue: string) => {
    setValue(newValue)
  }

  const [creditlineValue, setCreditlineValue] = React.useState<string | undefined>(undefined)

  const onChangeCreditline = (newValue: string) => {
    setCreditlineValue(newValue)
  }

  const [status, , setTxId] = useTransactionState()
  const [creditlineStatus, , setCreditlineTxId] = useTransactionState()

  const save = async () => {
    if (value && value !== (poolData?.reserve || new BN(0)).toString()) {
      const txId = await props.createTransaction(`Set max reserve`, 'setMaxReserve', [props.tinlake, value.toString()])
      setTxId(txId)
    }

    if (
      creditlineValue &&
      poolData?.maker?.creditline &&
      creditlineValue !== (poolData?.maker?.creditline || new BN(0)).toString()
    ) {
      const currentCreditline = poolData?.maker?.creditline.toString()
      const amount = new BN(creditlineValue).gt(new BN(currentCreditline))
        ? new BN(creditlineValue).sub(new BN(currentCreditline))
        : new BN(currentCreditline).sub(new BN(creditlineValue))
      const valueToDecimal = new Decimal(baseToDisplay(creditlineValue, 18)).toDecimalPlaces(4)
      const formatted = addThousandsSeparators(valueToDecimal.toString())

      if (new BN(creditlineValue).gt(new BN(currentCreditline))) {
        const txId = await props.createTransaction(`Increase creditline to ${formatted}`, 'raiseCreditline', [
          props.tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      } else {
        const txId = await props.createTransaction(`Lower creditline to ${formatted}`, 'sinkCreditline', [
          props.tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      }
    }
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadPool && props.loadPool(props.tinlake)
      props.setShowMaxReserveForm(false)
    }
  }, [status])

  return (
    <Box>
      <Heading level="5" margin={{ top: '0', bottom: '0' }}>
        Set maximum reserve amount
      </Heading>
      <Description margin={{ top: 'small' }}>
        This will determine how much can be invested into the reserve right now.
      </Description>

      <TokenInput
        token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
        value={value === undefined ? poolData?.maxReserve.toString() || '0' : value}
        onChange={onChange}
        disabled={status === 'pending' || status === 'unconfirmed'}
      />

      <Heading level="5" margin={{ top: 'large', bottom: '0' }}>
        Set Maker creditline
      </Heading>
      <Description margin={{ top: 'small' }}>This will lock in the required TIN for overcollateralization.</Description>

      <TokenInput
        token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
        value={creditlineValue === undefined ? poolData?.maker?.creditline?.toString() || '0' : creditlineValue}
        onChange={onChangeCreditline}
        disabled={status === 'pending' || status === 'unconfirmed'}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button
          label="Cancel"
          onClick={() => props.setShowMaxReserveForm(false)}
          disabled={status === 'pending' || status === 'unconfirmed'}
        />
        <Button primary label="Set" onClick={save} disabled={status === 'pending' || status === 'unconfirmed'} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadPool, createTransaction })(MaxReserveForm)
