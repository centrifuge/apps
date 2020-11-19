import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../config'
import { toPrecision } from '../../../utils/toPrecision'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import { connect } from 'react-redux'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

import { Description, OrderSteps } from './styles'
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
      <Heading level="6" margin={{ top: 'small', bottom: 'xsmall' }}>
        {token} available for collection
      </Heading>
      <Description>
        Your {props.tranche === 'senior' ? 'DROP' : 'TIN'} {type.toLowerCase()} order has been executed. Your{' '}
        {props.tranche === 'senior' ? 'DROP' : 'TIN'} tokens are already earning yield. You need to collect your tokens
        before you can submit new orders.
      </Description>

      <OrderSteps
        src={`/static/steps/collect-${type === 'Invest' ? 'dai' : props.tranche === 'senior' ? 'drop' : 'tin'}-${
          type === 'Invest' ? (props.tranche === 'senior' ? 'drop' : 'tin') : 'dai'
        }.svg`}
        alt="Order steps"
      />

      <Table margin={{ top: 'medium' }}>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Type of transaction</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {type} {props.tranche === 'senior' ? 'DROP' : 'TIN'}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell scope="row">Order amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(orderedAmount, 18), 2))}{' '}
              {props.tranche === 'senior' ? 'DROP' : 'TIN'}
            </TableCell>
          </TableRow> */}
          <TableRow>
            <TableCell scope="row">Settled amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(settledAmount, 18), 4))}{' '}
              {props.tranche === 'senior' ? 'DROP' : 'TIN'}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell scope="row">Settled token price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(props.tokenPrice, 27), 2))}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Transaction value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(transactionValue, 18), 2))} DAI
            </TableCell>
          </TableRow> */}
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button primary label="Collect" onClick={collect} disabled={disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(CollectCard)
