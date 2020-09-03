import * as React from 'react'
import BN from 'bn.js'
import { Box, FormField, Button, Heading } from 'grommet'
import { baseToDisplay, displayToBase } from '@centrifuge/tinlake-js'
import NumberInput from '../../../components/NumberInput'
import { loadPool } from '../../../ducks/pool'
import { connect } from 'react-redux'
import { Decimal } from 'decimal.js-light'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'

Decimal.set({
  precision: 27,
  toExpNeg: -7,
  toExpPos: 30,
})

interface Props extends TransactionProps {
  minJuniorRatio: BN
  tinlake: any
  loadPool?: (tinlake: any) => Promise<void>
}

const JuniorRatio: React.FC<Props> = (props: Props) => {
  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')

  React.useEffect(() => {
    // Multiply with 100 to show the percent value
    const normalizedJuniorRatio = props.minJuniorRatio && new Decimal(props.minJuniorRatio.toString()).mul(100)
    setMinJuniorRatio((normalizedJuniorRatio && normalizedJuniorRatio.toString()) || '0')
  }, [props.minJuniorRatio])

  const [status, , setTxId] = useTransactionState()

  const updateMinJuniorRatio = async () => {
    const normalizedRatio = new Decimal(minJuniorRatio).div(100).toString()

    const txId = await props.createTransaction(`Set min TIN ratio`, 'setMinJuniorRatio', [
      props.tinlake,
      normalizedRatio,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      loadPool && loadPool(props.tinlake)
    }
  }, [status])

  return (
    <Box pad={{ horizontal: 'medium' }}>
      <Box direction="row" margin={{ top: 'medium' }}>
        <Heading level="4">Set minimum TIN ratio</Heading>
      </Box>
      <Box direction="row" gap="medium">
        <Box basis={'1/3'}>
          <FormField label="Min TIN ratio">
            <NumberInput
              value={baseToDisplay(minJuniorRatio, 27)}
              precision={2}
              onValueChange={({ value }) => setMinJuniorRatio(displayToBase(value, 27))}
              disabled={status === 'unconfirmed' || status === 'pending'}
            />
          </FormField>
        </Box>
        <Box align="start">
          <Button
            primary
            label="Set min TIN ratio"
            onClick={updateMinJuniorRatio}
            disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadPool, createTransaction })(JuniorRatio)
