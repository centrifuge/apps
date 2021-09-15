import { Modal } from '@centrifuge/axis-modal'
import { baseToDisplay, displayToBase, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, CheckBox, FormField, Heading, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { toPrecision } from '../../utils/toPrecision'
import { useEpoch } from '../../utils/useEpoch'
import { usePool } from '../../utils/usePool'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const AdminActions: React.FC<Props> = (props: Props) => {
  const { data: poolData, refetch: refetchPoolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: epochData } = useEpoch(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [minJuniorRatio, setMinJuniorRatio] = React.useState('0')
  const [maxJuniorRatio, setMaxJuniorRatio] = React.useState('0')
  const [, setSeniorInterestRate] = React.useState('0')
  const [discountRate, setDiscountRate] = React.useState('0')
  const [, setMinimumEpochTime] = React.useState('0')
  const [, setChallengeTime] = React.useState('0')

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

  const [minRatioStatus, ,] = useTransactionState()

  // const saveMinJuniorRatio = async () => {
  //   const txId = await props.createTransaction(`Set min TIN risk buffer`, 'setMinJuniorRatio', [
  //     props.tinlake,
  //     minJuniorRatio.toString(),
  //   ])
  //   setMinRatioTxId(txId)
  // }

  const [maxRatioStatus, ,] = useTransactionState()

  // const saveMaxJuniorRatio = async () => {
  //   const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
  //     props.tinlake,
  //     maxJuniorRatio.toString(),
  //   ])
  //   setMaxRatioTxId(txId)
  // }

  const [seniorInterestRateStatus, ,] = useTransactionState()

  const saveSeniorInterestRate = async () => {
    // const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
    //   props.tinlake,
    //   maxJuniorRatio.toString(),
    // ])
    // setMaxRatioTxId(txId)
  }

  const [discountRateStatus, ,] = useTransactionState()

  // const saveDiscountRate = async () => {
  // const txId = await props.createTransaction(`Set max TIN risk buffer`, 'setMaxJuniorRatio', [
  //   props.tinlake,
  //   maxJuniorRatio.toString(),
  // ])
  // setMaxRatioTxId(txId)
  // }

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

  const [modalIsOpen, setModalIsOpen] = React.useState(false)
  const [checked, setChecked] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <>
      {poolData && (
        <Card p="medium" mb="medium">
          <Box direction="row" gap="medium">
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  Min TIN risk buffer
                </Heading>
              </Box>

              <FormField>
                <NumberInput
                  value={baseToDisplay(minJuniorRatio, 25)}
                  precision={2}
                  onValueChange={({ value }) => setMinJuniorRatio(displayToBase(value, 25))}
                  suffix="%"
                  disabled={
                    !poolData?.adminLevel ||
                    poolData.adminLevel < 3 ||
                    minRatioStatus === 'unconfirmed' ||
                    minRatioStatus === 'pending'
                  }
                />
              </FormField>
            </Box>
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  Max TIN risk buffer
                </Heading>
              </Box>

              <FormField>
                <NumberInput
                  value={baseToDisplay(maxJuniorRatio, 25)}
                  precision={2}
                  onValueChange={({ value }) => setMaxJuniorRatio(displayToBase(value, 25))}
                  suffix="%"
                  disabled={
                    !poolData?.adminLevel ||
                    poolData.adminLevel < 3 ||
                    maxRatioStatus === 'unconfirmed' ||
                    maxRatioStatus === 'pending'
                  }
                />
              </FormField>
            </Box>
          </Box>

          <Explanation>
            The minimum TIN risk buffer indicates the lower limit and ensures that DROP investors are protected by a
            certain amount of TIN invested in the pool at any time.
          </Explanation>

          <Box direction="row" gap="medium">
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  DROP APR
                </Heading>
              </Box>

              <FormField>
                <NumberInput
                  value={toPrecision(feeToInterestRate(new BN(poolData?.senior.interestRate || '0')), 2)}
                  precision={2}
                  onValueChange={({ value }) => setSeniorInterestRate(displayToBase(value, 25))}
                  suffix="%"
                  disabled={
                    !poolData?.adminLevel ||
                    poolData.adminLevel < 3 ||
                    seniorInterestRateStatus === 'unconfirmed' ||
                    seniorInterestRateStatus === 'pending'
                  }
                />
              </FormField>
            </Box>
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  Discount rate
                </Heading>
              </Box>

              <FormField>
                <NumberInput
                  value={baseToDisplay(poolData?.discountRate || new BN(0), 25)}
                  precision={2}
                  onValueChange={({ value }) => setDiscountRate(displayToBase(value, 25))}
                  suffix="%"
                  disabled={
                    !poolData?.adminLevel ||
                    poolData.adminLevel < 3 ||
                    discountRateStatus === 'unconfirmed' ||
                    discountRateStatus === 'pending'
                  }
                />
              </FormField>
            </Box>
          </Box>

          <Explanation>
            DROP tokens earn yield on the outstanding assets at the DROP APR. The effective APY may deviate due to
            compounding effects or unused liquidity in the pool reserve.
          </Explanation>

          <Box direction="row" gap="medium">
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  Minimum epoch time
                </Heading>
              </Box>

              <Box direction="row" gap="medium">
                <Box basis="1/2">
                  <FormField>
                    <NumberInput value={'23'} precision={0} suffix=" hours" />
                  </FormField>
                </Box>
                <Box basis="1/2">
                  <FormField>
                    <NumberInput value={'50'} precision={0} suffix=" minutes" />
                  </FormField>
                </Box>
              </Box>
            </Box>
            <Box basis="1/2">
              <Box margin={{ vertical: '0' }}>
                <Heading level="5" margin={{ vertical: '0' }}>
                  Challenge time
                </Heading>
              </Box>

              <FormField>
                <NumberInput value={'30'} precision={0} suffix=" minutes" />
              </FormField>
            </Box>
          </Box>

          <Explanation>
            Minimum time per epoch for this pool during which invest and redeem orders can be locked. At the end of the
            epoch, the locked orders will be executed by the smart contracts. An epoch can also take longer if no
            outstanding orders are locked.
          </Explanation>
          <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
            <Button
              primary
              label="Update"
              onClick={() => setModalIsOpen(true)}
              disabled={
                !poolData?.adminLevel ||
                poolData.adminLevel < 3 ||
                discountRateStatus === 'unconfirmed' ||
                discountRateStatus === 'pending' ||
                discountRate === poolData.discountRate.toString()
              }
            />
          </Box>

          <Modal
            opened={modalIsOpen}
            title={'Advance notice confirmation.'}
            style={{ maxWidth: '800px' }}
            headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
            titleIcon={<StatusInfoIcon />}
            onClose={closeModal}
          >
            <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
              Per the Subscription Agreement, you need to communicate any parameter changes to your Tinlake pool to the
              investors 14 days in advance.
            </Paragraph>

            <FormFieldWithoutBorder>
              <CheckBox
                checked={checked}
                label={
                  <div style={{ lineHeight: '24px' }}>
                    I confirm that 14 days have passed since I have communicated this parameter change to the investors.
                  </div>
                }
                onChange={(event) => setChecked(event.target.checked)}
              />
            </FormFieldWithoutBorder>
            <Box direction="row" justify="end" margin={{ top: 'medium' }}>
              <Box basis={'1/5'}>
                <Button primary onClick={closeModal} label="OK" fill={true} />
              </Box>
            </Box>
          </Modal>
        </Card>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(AdminActions)

const Explanation = styled.div`
  color: #666;
  margin: 24px 0 48px 0;
`

export const FormFieldWithoutBorder = styled(FormField)`
  > div {
    border-bottom-color: rgba(0, 0, 0, 0);
    padding: 0;
  }

  > span {
    margin: 12px 0 0 34px;
    font-weight: bold;
  }
`
