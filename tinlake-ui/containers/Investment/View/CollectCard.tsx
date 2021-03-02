import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import { Description, Info, OrderSteps } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  disbursements: any
  tokenPrice: string
  tinlake: any
  updateTrancheData: () => void
}

const CollectCard: React.FC<Props> = (props: Props) => {
  const type = props.disbursements.payoutCurrencyAmount.isZero() ? 'Invest' : 'Redeem'
  const token = type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'

  const [status, , setTxId] = useTransactionState()

  // const orderedAmount =
  //   type === 'Invest'
  //     ? props.disbursements.remainingSupplyCurrency
  //         .div(new BN(props.tokenPrice).div(new BN(10).pow(new BN(9))))
  //         .mul(new BN(10).pow(new BN(18)))
  //         .toString()
  //     : new BN(0)

  // If it's a redeem order, then convert amount from DAI into DROP/TIN
  const settledAmount =
    type === 'Invest'
      ? props.disbursements.payoutTokenAmount
      : new BN(props.disbursements.payoutCurrencyAmount)
          .div(new BN(props.tokenPrice).div(new BN(10).pow(new BN(9))))
          .mul(new BN(10).pow(new BN(18)))
          .toString()

  // If it's an invest order, then convert amount from DROP/TIN into DAI
  // const transactionValue =
  //   type === 'Invest'
  //     ? props.disbursements.payoutTokenAmount
  //         .mul(new BN(props.tokenPrice))
  //         .div(new BN(10).pow(new BN(27)))
  //         .toString()
  //     : props.disbursements.payoutCurrencyAmount.toString()

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
          {token} available for collection
        </Heading>
        <Description>
          Your order has been executed. To finalize your {type === 'Invest' ? 'investment' : 'redemption'}, please
          collect your {type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'}. Upon collection, the{' '}
          {type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'} will be transferred to your
          wallet.
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
