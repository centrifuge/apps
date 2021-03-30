import { TokenInput } from '@centrifuge/axis-token-input'
import { ITinlake } from '@centrifuge/tinlake-js'
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

  const [status, , setTxId] = useTransactionState()

  const save = async () => {
    if (value) {
      const txId = await props.createTransaction(`Set max reserve`, 'setMaxReserve', [props.tinlake, value.toString()])
      setTxId(txId)
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
      <Description margin={{ top: 'medium' }}>Please update the maximum reserve amount.</Description>

      <TokenInput
        token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
        value={value === undefined ? poolData?.maxReserve.toString() || '0' : value}
        onChange={onChange}
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
