import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Decimal } from 'decimal.js-light'
import { Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Box } from '../../../components/Layout'
import { RewardsWarning } from '../../../components/RewardsWarning'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toMaxPrecision } from '../../../utils/toPrecision'
import { Description, Info, OrderSteps } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  selectedPool?: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  disbursements: any
  tokenPrice: string
  updateTrancheData: () => void
}

const CollectCard: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const type = props.disbursements?.payoutCurrencyAmount.isZero() ? 'Invest' : 'Redeem'
  const token =
    type === 'Invest'
      ? props.tranche === 'senior'
        ? 'DROP'
        : 'TIN'
      : props.selectedPool?.metadata.currencySymbol || 'DAI'

  const [status, , setTxId] = useTransactionState()

  const amount = type === 'Invest' ? props.disbursements?.payoutTokenAmount : props.disbursements?.payoutCurrencyAmount
  const remaining =
    type === 'Invest' ? props.disbursements?.remainingSupplyCurrency : props.disbursements?.remainingRedeemToken

  const collect = async () => {
    const valueToDecimal = new Decimal(
      baseToDisplay(
        type === 'Invest' ? props.disbursements?.payoutTokenAmount : props.disbursements?.payoutCurrencyAmount,
        18
      )
    ).toFixed(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'disburseSenior' : 'disburseJunior'
    const txId = await props.createTransaction(`Collect ${formatted} ${token}`, method, [tinlake])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled = status === 'unconfirmed' || status === 'pending'

  return (
    <div>
      <Info>
        <Heading level="6" margin={{ top: 'small', bottom: 'xsmall' }}>
          {addThousandsSeparators(toMaxPrecision(baseToDisplay(amount || '0', 18), 4))}{' '}
          {type === 'Invest'
            ? props.tranche === 'senior'
              ? 'DROP'
              : 'TIN'
            : props.selectedPool?.metadata.currencySymbol || 'DAI'}{' '}
          waiting for collection
        </Heading>
        <Description>
          Your {type === 'Invest' ? 'investment' : 'redemption'} order has been {remaining?.gtn(0) && 'partially '}{' '}
          executed. Please collect your{' '}
          {type === 'Invest'
            ? props.tranche === 'senior'
              ? 'DROP'
              : 'TIN'
            : props.selectedPool?.metadata.currencySymbol || 'DAI'}{' '}
          at your convenience to transfer them to your ETH account.{' '}
          {remaining?.gtn(0) && (
            <Box mt="small">
              The remaining {addThousandsSeparators(toMaxPrecision(baseToDisplay(remaining, 18), 4))}{' '}
              {type === 'Redeem'
                ? props.tranche === 'senior'
                  ? 'DROP'
                  : 'TIN'
                : props.selectedPool?.metadata.currencySymbol || 'DAI'}{' '}
              is still locked for {type === 'Invest' ? 'investment' : 'redemption'} and will be executed in the next
              epochs. You can keep it locked or cancel after collecting your{' '}
              {type === 'Invest'
                ? props.tranche === 'senior'
                  ? 'DROP'
                  : 'TIN'
                : props.selectedPool?.metadata.currencySymbol || 'DAI'}
              .
            </Box>
          )}
        </Description>
        <OrderSteps
          src={`/static/steps/collect-${type === 'Invest' ? 'dai' : props.tranche === 'senior' ? 'drop' : 'tin'}-${
            type === 'Invest' ? (props.tranche === 'senior' ? 'drop' : 'tin') : 'dai'
          }.svg`}
          alt="Order steps"
        />
      </Info>

      {props.tranche === 'senior' && type === 'Invest' && <RewardsWarning mt="medium" bleedX="medium" />}

      <ButtonGroup mt="medium">
        <Button primary label="Collect" onClick={collect} disabled={disabled} />
      </ButtonGroup>
    </div>
  )
}

export default connect((state) => state, { createTransaction })(CollectCard)
