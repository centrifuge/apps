import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { connect } from 'react-redux'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import BN from 'bn.js'
import { EpochData } from './index'

import { Description, Warning, Info } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  disbursements: any
  tokenPrice: string
  tinlake: ITinlakeV3
  updateTrancheData: () => void
  epochData: EpochData | undefined
}

const OrderCard: React.FC<Props> = (props: Props) => {
  const type = props.disbursements.remainingSupplyCurrency.isZero() ? 'Redeem' : 'Invest'
  const token = type === 'Invest' ? 'DAI' : props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [confirmCancellation, setConfirmCancellation] = React.useState(false)

  const lockedValue =
    props.disbursements &&
    !(props.disbursements.remainingSupplyCurrency.isZero() && props.disbursements.remainingRedeemToken.isZero())
      ? (props.disbursements.remainingSupplyCurrency.isZero()
          ? props.disbursements.remainingRedeemToken
          : props.disbursements.remainingSupplyCurrency
        )
          .mul(new BN(props.tokenPrice))
          .div(new BN(10).pow(new BN(27)))
          .toString()
      : '0'

  const [status, , setTxId] = useTransactionState()

  const cancel = async () => {
    const method =
      type === 'Invest'
        ? props.tranche === 'senior'
          ? 'cancelSeniorSupplyOrder'
          : 'cancelJuniorSupplyOrder'
        : props.tranche === 'senior'
        ? 'cancelSeniorRedeemOrder'
        : 'cancelJuniorRedeemOrder'
    const txId = await props.createTransaction(`Cancel ${type.toLowerCase()} order`, method, [props.tinlake])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled =
    status === 'pending' ||
    status === 'unconfirmed' ||
    props.epochData?.state === 'in-submission-period' ||
    props.epochData?.state === 'in-challenge-period' ||
    props.epochData?.state === 'challenge-period-ended'

  return (
    <Box>
      <Heading level="6" margin={{ bottom: 'xsmall' }}>
        Pending {type} Order
      </Heading>
      <Description>
        You have locked {token} to {type.toLowerCase()} {type === 'Invest' ? 'into' : 'from'} Tinlake for the next
        epoch. You can cancel or update this order until the end of the current epoch.
      </Description>

      <Table margin={{ top: 'medium' }}>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Type of transaction</TableCell>
            <TableCell style={{ textAlign: 'end' }}>{type}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Amount locked</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(
                toPrecision(
                  baseToDisplay(
                    props.disbursements.remainingRedeemToken.isZero()
                      ? props.disbursements.remainingSupplyCurrency
                      : props.disbursements.remainingRedeemToken,
                    18
                  ),
                  2
                )
              )}{' '}
              {token}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">
              {type === 'Redeem' ? 'Locked value at current token price' : `Token amount at current token price`}
            </TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(toPrecision(baseToDisplay(lockedValue, 18), 2))}{' '}
              {type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {(props.epochData?.state === 'in-submission-period' ||
        props.epochData?.state === 'in-challenge-period' ||
        props.epochData?.state === 'challenge-period-ended') && (
        <Info>
          <Heading level="6" margin={{ bottom: 'xsmall' }}>
            Computing orders
          </Heading>
          The Epoch has just been closed and the order executions are currently being computed. Your executed order will
          be available for collection soon.
        </Info>
      )}

      {confirmCancellation && (
        <>
          <Warning>
            <Heading level="6" margin={{ bottom: 'xsmall' }}>
              Cancel Pending {type} Order
            </Heading>
            Please confirm that you want to cancel your pending order. Your {token} will be unlocked and transferred
            back to your wallet.
          </Warning>

          <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
            <Button label="Back" onClick={() => setConfirmCancellation(false)} />
            <Button primary label="Cancel Order" onClick={cancel} disabled={disabled} />
          </Box>
        </>
      )}

      {!confirmCancellation && (
        <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
          <Button primary label="Cancel Order" onClick={() => setConfirmCancellation(true)} disabled={disabled} />
          {/* <Button primary label="Update Order" /> */}
        </Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(OrderCard)
