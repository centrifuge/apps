import { Modal } from '@centrifuge/axis-modal'
import { baseToDisplay, displayToBase, feeToInterestRate, interestRateToFee, ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, CheckBox, FormField, Heading, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
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
  const [seniorInterestRate, setSeniorInterestRate] = React.useState('0')
  const [discountRate, setDiscountRate] = React.useState('0.0')
  const [epochTimeHours, setEpochTimeHours] = React.useState(0)
  const [epochTimeMinutes, setEpochTimeMinutes] = React.useState(0)
  const [challengeTime, setChallengeTime] = React.useState('0')

  React.useEffect(() => {
    if (poolData) {
      setMinJuniorRatio(poolData.minJuniorRatio.toString())
      setMaxJuniorRatio(poolData.maxJuniorRatio.toString())
      setSeniorInterestRate(poolData.senior?.interestRate ? feeToInterestRate(poolData.senior?.interestRate) : '0.0')
      setDiscountRate(feeToInterestRate(poolData.discountRate))

      const seconds = epochData?.minimumEpochTime ? Number(epochData?.minimumEpochTime.toString()) : 0
      const hours = Math.floor(seconds / 60 / 60)
      setEpochTimeHours(hours)
      const minutes = Math.round((seconds / 60 / 60 - hours) * 60)
      setEpochTimeMinutes(minutes)

      setChallengeTime(epochData?.challengeTime?.toString() || '0')
    }
  }, [poolData])

  const [minJuniorRatioStatus, , setMinJuniorRatioTxId] = useTransactionState()
  const [maxJuniorRatioStatus, , setMaxJuniorRatioTxId] = useTransactionState()
  const [discountRateStatus, , setDiscountRateTxId] = useTransactionState()
  const [seniorInterestRateStatus, , setSeniorInterestRateTxId] = useTransactionState()
  const [minimumEpochTimeStatus, ,] = useTransactionState()
  const [challengeTimeStatus, ,] = useTransactionState()

  const changedMinJuniorRatio =
    minJuniorRatio && poolData?.minJuniorRatio && minJuniorRatio !== poolData.minJuniorRatio.toString()

  const changedMaxJuniorRatio =
    maxJuniorRatio && poolData?.maxJuniorRatio && maxJuniorRatio !== poolData.maxJuniorRatio.toString()

  const changedDiscountRate =
    discountRate && poolData?.discountRate && discountRate !== feeToInterestRate(poolData.discountRate)

  const changedSeniorInterestRate =
    seniorInterestRate &&
    poolData?.senior?.interestRate &&
    seniorInterestRate !== feeToInterestRate(poolData.senior?.interestRate)

  const update = async () => {
    if (changedMinJuniorRatio && minJuniorRatio) {
      const txId = await props.createTransaction(`Set min TIN ratio`, 'setMinJuniorRatio', [
        props.tinlake,
        minJuniorRatio.toString(),
      ])
      setMinJuniorRatioTxId(txId)
    }

    if (changedMaxJuniorRatio && maxJuniorRatio) {
      const txId = await props.createTransaction(`Set max TIN ratio`, 'setMaxJuniorRatio', [
        props.tinlake,
        maxJuniorRatio.toString(),
      ])
      setMaxJuniorRatioTxId(txId)
    }

    if (changedDiscountRate && discountRate) {
      const txId = await props.createTransaction(`Set discount rate`, 'setDiscountRate', [
        props.tinlake,
        interestRateToFee(discountRate),
      ])
      setDiscountRateTxId(txId)
    }

    if (changedSeniorInterestRate && seniorInterestRate) {
      const txId = await props.createTransaction(`Set DROP APR`, 'setSeniorInterestRate', [
        props.tinlake,
        interestRateToFee(seniorInterestRate),
      ])
      setSeniorInterestRateTxId(txId)
    }
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      refetchPoolData()
    }
  }, [status])

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
                    minJuniorRatioStatus === 'unconfirmed' ||
                    minJuniorRatioStatus === 'pending'
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
                    maxJuniorRatioStatus === 'unconfirmed' ||
                    maxJuniorRatioStatus === 'pending'
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
                  value={seniorInterestRate ? seniorInterestRate : '0.0'}
                  precision={2}
                  onValueChange={({ value }) => setSeniorInterestRate(value)}
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
                  value={discountRate ? discountRate : '0.0'}
                  precision={2}
                  onValueChange={({ value }) => setDiscountRate(value)}
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
                    <NumberInput
                      value={epochTimeHours.toString()}
                      precision={0}
                      suffix=" hours"
                      onValueChange={({ value }) => setEpochTimeHours(Number(value))}
                      disabled={
                        !poolData?.adminLevel ||
                        poolData.adminLevel < 3 ||
                        minimumEpochTimeStatus === 'unconfirmed' ||
                        minimumEpochTimeStatus === 'pending'
                      }
                    />
                  </FormField>
                </Box>
                <Box basis="1/2">
                  <FormField>
                    <NumberInput
                      value={epochTimeMinutes.toString()}
                      precision={0}
                      suffix=" minutes"
                      onValueChange={({ value }) => setEpochTimeMinutes(Number(value))}
                      disabled={
                        !poolData?.adminLevel ||
                        poolData.adminLevel < 3 ||
                        minimumEpochTimeStatus === 'unconfirmed' ||
                        minimumEpochTimeStatus === 'pending'
                      }
                    />
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
                <NumberInput
                  value={(Number(challengeTime) / 60).toString()}
                  precision={0}
                  suffix=" minutes"
                  onValueChange={({ value }) => setChallengeTime((Number(value) * 60).toString())}
                  disabled={
                    !poolData?.adminLevel ||
                    poolData.adminLevel < 3 ||
                    challengeTimeStatus === 'unconfirmed' ||
                    challengeTimeStatus === 'pending'
                  }
                />
              </FormField>
            </Box>
          </Box>

          <Explanation>
            Minimum time per epoch for this pool during which invest and redeem orders can be locked. At the end of the
            epoch, the locked orders will be executed by the smart contracts. An epoch can also take longer if no
            outstanding orders are locked.
          </Explanation>

          {poolData?.adminLevel && poolData.adminLevel >= 3 && (
            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Update"
                onClick={openModal}
                disabled={!poolData?.adminLevel || poolData.adminLevel < 3}
              />
            </Box>
          )}

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
                <Button
                  primary
                  onClick={() => {
                    update()
                    closeModal()
                  }}
                  label="OK"
                  fill={true}
                />
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
