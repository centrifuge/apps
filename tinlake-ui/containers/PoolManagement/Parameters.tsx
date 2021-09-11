import { baseToDisplay, displayToBase, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, FormField, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toPrecision } from '../../utils/toPrecision'
import { useEpoch } from '../../utils/useEpoch'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const AdminActions: React.FC<Props> = (props: Props) => {
  const { data: poolData, refetch: refetchPoolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: epochData, refetch: refetchEpochData } = useEpoch(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')
  const [maxJuniorRatio, setMaxJuniorRatio] = React.useState('0')
  const [seniorInterestRate, setSeniorInterestRate] = React.useState('0')
  const [discountRate, setDiscountRate] = React.useState('0')
  const [minimumEpochTime, setMinimumEpochTime] = React.useState('0')
  const [challengeTime, setChallengeTime] = React.useState('0')

  React.useEffect(() => {
    if (poolData) {
      setMinJuniorRatio(poolData.minJuniorRatio.toString())
      setMaxJuniorRatio(poolData.maxJuniorRatio.toString())
      setSeniorInterestRate(poolData.senior?.interestRate?.toString() || '0')
      setDiscountRate(feeToInterestRate(poolData.discountRate))
      setMinimumEpochTime(epochData?.minimumEpochTime?.toString() || '0')
      setChallengeTime(epochData?.challengeTime?.toString() || '0')
    }
  }, [poolData])

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

  const [seniorInterestRateStatus, , setSeniorInterestRateTxId] = useTransactionState()

  const saveSeniorInterestRate = async () => {
    // const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
    //   props.tinlake,
    //   maxJuniorRatio.toString(),
    // ])
    // setMaxRatioTxId(txId)
  }

  const [discountRateStatus, , setDiscountRateTxId] = useTransactionState()

  const saveDiscountRate = async () => {
    // const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
    //   props.tinlake,
    //   maxJuniorRatio.toString(),
    // ])
    // setMaxRatioTxId(txId)
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
        <Card p="medium" mb="medium" style={{ width: '600px' }}>
          <Box margin={{ bottom: 'medium' }}>
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
          </Box>

          <Box margin={{ bottom: 'medium' }}>
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
          </Box>

          <Box margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                DROP APR
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {toPrecision(feeToInterestRate(poolData.senior?.interestRate || '0'), 2)}%
              </Heading>
            </Box>

            <FormField label="Set DROP APR">
              <NumberInput
                value={toPrecision(feeToInterestRate(new BN(seniorInterestRate || '0')), 2)}
                precision={2}
                onValueChange={({ value }) => setSeniorInterestRate(displayToBase(value, 25))}
                disabled={seniorInterestRateStatus === 'unconfirmed' || seniorInterestRateStatus === 'pending'}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Apply"
                onClick={saveSeniorInterestRate}
                disabled={
                  seniorInterestRateStatus === 'unconfirmed' ||
                  seniorInterestRateStatus === 'pending' ||
                  seniorInterestRate === (poolData.senior?.interestRate?.toString() || '0')
                }
              />
            </Box>
          </Box>

          <Box>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Discount rate
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                {toPrecision(feeToInterestRate(poolData.discountRate), 2)}%
              </Heading>
            </Box>

            <FormField label="Set discount rate">
              <NumberInput
                value={baseToDisplay(discountRate, 25)}
                precision={2}
                onValueChange={({ value }) => setDiscountRate(displayToBase(value, 25))}
                disabled={discountRateStatus === 'unconfirmed' || discountRateStatus === 'pending'}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Apply"
                onClick={saveSeniorInterestRate}
                disabled={
                  discountRateStatus === 'unconfirmed' ||
                  discountRateStatus === 'pending' ||
                  discountRate === poolData.discountRate.toString()
                }
              />
            </Box>
          </Box>
        </Card>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(AdminActions)
