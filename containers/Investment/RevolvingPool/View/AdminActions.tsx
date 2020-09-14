import * as React from 'react'
import { Box, Button, Heading, FormField } from 'grommet'
import { Pool } from '../../../../config'
import { baseToDisplay, displayToBase } from '@centrifuge/tinlake-js'
import NumberInput from '../../../../components/NumberInput'
import { loadPool } from '../../../../ducks/pool'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { Decimal } from 'decimal.js-light'
import { connect, useSelector } from 'react-redux'

interface Props extends TransactionProps {
  tinlake: ITinlakeV3
  pool: Pool
  loadPool?: (tinlake: any) => Promise<void>
}

const AdminActions: React.FC<Props> = (props: Props) => {
  const pool = useSelector((state: any) => state.pool)

  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')

  React.useEffect(() => {
    if (pool && pool.data) {
      setMinJuniorRatio(pool.data.minJuniorRatio.toString())
    }
  }, [pool])

  React.useEffect(() => {
    props.loadPool && props.loadPool(props.tinlake)
  }, [props.tinlake])

  const [status, , setTxId] = useTransactionState()

  const saveMinJuniorRatio = async () => {
    const txId = await props.createTransaction(`Set min TIN risk buffer`, 'setMinJuniorRatio', [
      props.tinlake,
      minJuniorRatio.toString(),
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadPool && props.loadPool(props.tinlake)
    }
  }, [status])

  return (
    <>
      {pool && pool.data && (
        <Box direction="row" gap="medium">
          <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Min TIN risk buffer
              </Heading>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(pool.data.minJuniorRatio, 25), 0))}%
              </Heading>
            </Box>

            <FormField label="Set minimum TIN risk buffer">
              <NumberInput
                value={baseToDisplay(minJuniorRatio, 25)}
                precision={2}
                onValueChange={({ value }) => setMinJuniorRatio(displayToBase(value, 25))}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Apply"
                onClick={() => saveMinJuniorRatio()}
                disabled={
                  status === 'unconfirmed' || status === 'pending' || minJuniorRatio === pool.data.minJuniorRatio
                }
              />
            </Box>
          </Box>

          <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Max TIN risk buffer
              </Heading>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(pool.data.minJuniorRatio, 25), 2))}%
              </Heading>
            </Box>

            <FormField label="Set maximum TIN risk buffer">
              <NumberInput
                value={baseToDisplay('0500000000000000000000000000', 27)}
                precision={2}
                onValueChange={({ value }) => console.log(displayToBase(value, 27))}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button primary label="Apply" />
            </Box>
          </Box>

          <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Max reserve
              </Heading>
              <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                50%
              </Heading>
            </Box>

            <FormField label="Set maximum reserve">
              <NumberInput
                value={baseToDisplay('0100000000000000000000000000', 27)}
                precision={2}
                onValueChange={({ value }) => console.log(displayToBase(value, 27))}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button primary label="Apply" />
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}

export default connect((state) => state, { loadPool, createTransaction })(AdminActions)
