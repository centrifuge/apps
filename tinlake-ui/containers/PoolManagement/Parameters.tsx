import { baseToDisplay, displayToBase } from '@centrifuge/tinlake-js'
import { Box, Button, FormField, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { useTinlake } from '../../components/TinlakeProvider'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toPrecision } from '../../utils/toPrecision'
import { usePool } from '../../utils/usePool'

const AdminActions: React.FC<TransactionProps> = (props: TransactionProps) => {
  const tinlake = useTinlake()
  const { data: poolData, refetch: refetchPoolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')
  const [maxJuniorRatio, setMaxJuniorRatio] = React.useState('0')

  React.useEffect(() => {
    if (poolData) {
      setMinJuniorRatio(poolData.minJuniorRatio.toString())
      setMaxJuniorRatio(poolData.maxJuniorRatio.toString())
    }
  }, [poolData])

  const [minRatioStatus, , setMinRatioTxId] = useTransactionState()

  const saveMinJuniorRatio = async () => {
    const txId = await props.createTransaction(`Set min TIN risk buffer`, 'setMinJuniorRatio', [
      tinlake,
      minJuniorRatio.toString(),
    ])
    setMinRatioTxId(txId)
  }

  const [maxRatioStatus, , setMaxRatioTxId] = useTransactionState()

  const saveMaxJuniorRatio = async () => {
    const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
      tinlake,
      maxJuniorRatio.toString(),
    ])
    setMaxRatioTxId(txId)
  }

  React.useEffect(() => {
    if (minRatioStatus === 'succeeded') {
      refetchPoolData()
    }
  }, [minRatioStatus])

  React.useEffect(() => {
    if (maxRatioStatus === 'succeeded') {
      refetchPoolData()
    }
  }, [maxRatioStatus])

  return (
    <>
      {poolData && (
        <Box direction="row" gap="medium">
          <Card width="400px" p="medium" mb="medium">
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Min TIN risk buffer
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.minJuniorRatio, 25), 2))}%
              </Heading>
            </Box>

            <FormField label="Set minimum TIN risk buffer">
              <NumberInput
                value={baseToDisplay(minJuniorRatio, 25)}
                precision={2}
                onValueChange={({ value }) => setMinJuniorRatio(displayToBase(value, 25))}
                disabled={minRatioStatus === 'unconfirmed' || minRatioStatus === 'pending'}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Apply"
                onClick={saveMinJuniorRatio}
                disabled={
                  minRatioStatus === 'unconfirmed' ||
                  minRatioStatus === 'pending' ||
                  minJuniorRatio === poolData.minJuniorRatio.toString()
                }
              />
            </Box>
          </Card>

          <Card width="400px" p="medium" mb="medium">
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Max TIN risk buffer
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {addThousandsSeparators(toPrecision(baseToDisplay(poolData.maxJuniorRatio, 25), 2))}%
              </Heading>
            </Box>

            <FormField label="Set maximum TIN risk buffer">
              <NumberInput
                value={baseToDisplay(maxJuniorRatio, 25)}
                precision={2}
                onValueChange={({ value }) => setMaxJuniorRatio(displayToBase(value, 25))}
                disabled={maxRatioStatus === 'unconfirmed' || maxRatioStatus === 'pending'}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Apply"
                onClick={saveMaxJuniorRatio}
                disabled={
                  maxRatioStatus === 'unconfirmed' ||
                  maxRatioStatus === 'pending' ||
                  maxJuniorRatio === poolData.maxJuniorRatio.toString()
                }
              />
            </Box>
          </Card>
        </Box>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(AdminActions)
