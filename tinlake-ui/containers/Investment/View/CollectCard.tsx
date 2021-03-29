import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Decimal } from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
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
  tinlake: any
  updateTrancheData: () => void
}

const CollectCard: React.FC<Props> = (props: Props) => {
  const type = props.disbursements.payoutCurrencyAmount.isZero() ? 'Invest' : 'Redeem'
  const token =
    type === 'Invest'
      ? props.tranche === 'senior'
        ? 'DROP'
        : 'TIN'
      : props.selectedPool?.metadata.currencySymbol || 'DAI'

  const [status, , setTxId] = useTransactionState()

  const amount = type === 'Invest' ? props.disbursements.payoutTokenAmount : props.disbursements.payoutCurrencyAmount

  const collect = async () => {
    const valueToDecimal = new Decimal(
      baseToDisplay(
        type === 'Invest' ? props.disbursements.payoutTokenAmount : props.disbursements.payoutCurrencyAmount,
        18
      )
    ).toFixed(4)
    const formatted = addThousandsSeparators(valueToDecimal.toString())

    const method = props.tranche === 'senior' ? 'disburseSenior' : 'disburseJunior'
    const txId = await props.createTransaction(`Collect ${formatted} ${token}`, method, [props.tinlake])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled = status === 'unconfirmed' || status === 'pending'

  return (
    <Box>
      <Info>
        <Heading level="6" margin={{ top: 'small', bottom: 'xsmall' }}>
          {addThousandsSeparators(toMaxPrecision(baseToDisplay(amount, 18), 4))}{' '}
          {type === 'Invest'
            ? props.tranche === 'senior'
              ? 'DROP'
              : 'TIN'
            : props.selectedPool?.metadata.currencySymbol || 'DAI'}{' '}
          waiting for collection
        </Heading>
        <Description>
          Your {type === 'Invest' ? 'investment' : 'redemption'} order has been executed.{' '}
          {type === 'Invest' &&
            `Your ${props.tranche === 'senior' ? 'DROP' : 'TIN'} tokens are already earning yield and CFG rewards. `}
          Please collect your{' '}
          {type === 'Invest'
            ? props.tranche === 'senior'
              ? 'DROP'
              : 'TIN'
            : props.selectedPool?.metadata.currencySymbol || 'DAI'}{' '}
          at your convenience to transfer them to your ETH account.
        </Description>
        <OrderSteps
          src={`/static/steps/collect-${type === 'Invest' ? 'dai' : props.tranche === 'senior' ? 'drop' : 'tin'}-${
            type === 'Invest' ? (props.tranche === 'senior' ? 'drop' : 'tin') : 'dai'
          }.svg`}
          alt="Order steps"
        />
      </Info>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button primary label="Collect" onClick={collect} disabled={disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(CollectCard)
