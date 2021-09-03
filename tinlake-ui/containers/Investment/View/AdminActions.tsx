import { baseToDisplay, displayToBase, ITinlake } from '@centrifuge/tinlake-js'
import { FormField, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Card } from '../../../components/Card'
import { Shelf, Stack, Wrap } from '../../../components/Layout'
import NumberInput from '../../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import { usePool } from '../../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const AdminActions: React.FC<Props> = (props: Props) => {
  const pool = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')
  const [maxJuniorRatio, setMaxJuniorRatio] = React.useState('0')

  React.useEffect(() => {
    if (pool && pool.data) {
      setMinJuniorRatio(pool.data.minJuniorRatio.toString())
      setMaxJuniorRatio(pool.data.maxJuniorRatio.toString())
    }
  }, [pool?.data])

  const [minRatioStatus, , setMinRatioTxId] = useTransactionState()

  const saveMinJuniorRatio = async () => {
    const txId = await props.createTransaction(`Set min TIN risk buffer`, 'setMinJuniorRatio', [
      props.tinlake,
      minJuniorRatio.toString(),
    ])
    setMinRatioTxId(txId)
  }

  const [maxRatioStatus, , setMaxRatioTxId] = useTransactionState()

  const saveMaxJuniorRatio = async () => {
    const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
      props.tinlake,
      maxJuniorRatio.toString(),
    ])
    setMaxRatioTxId(txId)
  }

  React.useEffect(() => {
    if (minRatioStatus === 'succeeded') {
      pool.refetch()
    }
  }, [minRatioStatus])

  React.useEffect(() => {
    if (maxRatioStatus === 'succeeded') {
      pool.refetch()
    }
  }, [maxRatioStatus])

  return (
    <>
      {pool && pool.data && (
        <Wrap gap="medium">
          <Card flex="0 1 400px" p="medium">
            <Stack gap="small">
              <Shelf justifyContent="space-between">
                <Heading level="5" margin={'0'}>
                  Min TIN risk buffer
                </Heading>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(pool.data.minJuniorRatio, 25), 2))}%
                </Heading>
              </Shelf>

              <FormField label="Set minimum TIN risk buffer">
                <NumberInput
                  value={baseToDisplay(minJuniorRatio, 25)}
                  precision={2}
                  onValueChange={({ value }) => setMinJuniorRatio(displayToBase(value, 25))}
                  disabled={minRatioStatus === 'unconfirmed' || minRatioStatus === 'pending'}
                />
              </FormField>

              <ButtonGroup>
                <Button
                  primary
                  label="Apply"
                  onClick={saveMinJuniorRatio}
                  disabled={
                    minRatioStatus === 'unconfirmed' ||
                    minRatioStatus === 'pending' ||
                    minJuniorRatio === pool.data.minJuniorRatio.toString()
                  }
                />
              </ButtonGroup>
            </Stack>
          </Card>

          <Card flex="0 1 400px" p="medium">
            <Stack gap="small">
              <Shelf justifyContent="space-between">
                <Heading level="5" margin={'0'}>
                  Max TIN risk buffer
                </Heading>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(pool.data.maxJuniorRatio, 25), 2))}%
                </Heading>
              </Shelf>

              <FormField label="Set maximum TIN risk buffer">
                <NumberInput
                  value={baseToDisplay(maxJuniorRatio, 25)}
                  precision={2}
                  onValueChange={({ value }) => setMaxJuniorRatio(displayToBase(value, 25))}
                  disabled={maxRatioStatus === 'unconfirmed' || maxRatioStatus === 'pending'}
                />
              </FormField>

              <ButtonGroup>
                <Button
                  primary
                  label="Apply"
                  onClick={() => saveMaxJuniorRatio()}
                  disabled={
                    maxRatioStatus === 'unconfirmed' ||
                    maxRatioStatus === 'pending' ||
                    maxJuniorRatio === pool.data.maxJuniorRatio.toString()
                  }
                />
              </ButtonGroup>
            </Stack>
          </Card>
        </Wrap>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(AdminActions)
