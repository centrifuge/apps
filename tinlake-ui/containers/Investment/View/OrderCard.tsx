import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { Pool } from '../../../config'
import { PoolState } from '../../../ducks/pool'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { secondsToHms } from '../../../utils/time'
import { toMaxPrecision, toPrecision } from '../../../utils/toPrecision'
import { Description, Info, MinTimeRemaining, OrderSteps, Warning } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  disbursements: any
  tokenPrice: string
  tinlake: ITinlake
  updateTrancheData: () => void
}

const OrderCard: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const epochData = pool?.epoch || undefined

  const type = props.disbursements.remainingSupplyCurrency.isZero() ? 'Redeem' : 'Invest'
  const token = type === 'Invest' ? 'DAI' : props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [confirmCancellation, setConfirmCancellation] = React.useState(false)

  const lockedValue =
    props.disbursements &&
    !new BN(props.tokenPrice).isZero() &&
    !(props.disbursements.remainingSupplyCurrency.isZero() && props.disbursements.remainingRedeemToken.isZero())
      ? props.disbursements.remainingSupplyCurrency.isZero()
        ? props.disbursements.remainingRedeemToken
            .mul(new BN(props.tokenPrice))
            .div(new BN(10).pow(new BN(27)))
            .toString()
        : props.disbursements.remainingSupplyCurrency
            .mul(new BN(10).pow(new BN(9 + 18)))
            .div(new BN(props.tokenPrice))
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
    const txId = await props.createTransaction(
      `Cancel ${props.tranche === 'senior' ? 'DROP' : 'TIN'} ${type.toLowerCase()} order`,
      method,
      [props.tinlake]
    )
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const rolledOver =
    epochData &&
    epochData?.id &&
    !epochData?.isBlockedState &&
    (props.tranche === 'senior' ? epochData?.seniorOrderedInEpoch : epochData?.juniorOrderedInEpoch) !== 0 &&
    epochData?.id !== (props.tranche === 'senior' ? epochData?.seniorOrderedInEpoch : epochData?.juniorOrderedInEpoch)
  const disabled = status === 'pending' || status === 'unconfirmed' || epochData?.isBlockedState

  return (
    <Box>
      <Info>
        <Heading level="6" margin={{ top: 'small', bottom: 'xsmall' }}>
          Locked{' '}
          {addThousandsSeparators(
            toMaxPrecision(
              baseToDisplay(
                props.disbursements.remainingRedeemToken.isZero()
                  ? props.disbursements.remainingSupplyCurrency
                  : props.disbursements.remainingRedeemToken,
                18
              ),
              4
            )
          )}{' '}
          {token} {type} Order
        </Heading>
        <Description>
          {!rolledOver && (
            <>
              You have succesfully locked your {token} to {type.toLowerCase()} {type === 'Invest' ? 'in' : 'from'}. This
              order will be executed at the end of the current epoch. Afterwards you can collect your{' '}
              {type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'}.
            </>
          )}
          {rolledOver && (
            <>
              Your {type.toLowerCase()} order wasn’t fully executed. Your {token} remains locked for{' '}
              {type === 'Invest' ? 'investment' : 'redemption'} for the next epoch. You can cancel this order until the
              end of the current epoch.
            </>
          )}
        </Description>

        <OrderSteps
          src={`/static/steps/locked-${type === 'Invest' ? 'dai' : props.tranche === 'senior' ? 'drop' : 'tin'}-${
            type === 'Invest' ? (props.tranche === 'senior' ? 'drop' : 'tin') : 'dai'
          }.svg`}
          alt="Order steps"
        />
        {epochData?.isBlockedState && (
          <Info>
            <Heading level="6" margin={{ bottom: 'xsmall' }}>
              Computing orders
            </Heading>
            The Epoch has just been closed and the order executions are currently being computed. Your executed order
            will be available for collection soon.
            {epochData?.minChallengePeriodEnd !== 0 && (
              <MinTimeRemaining>
                Minimum time remaining:{' '}
                {secondsToHms(epochData.minChallengePeriodEnd + 60 - new Date().getTime() / 1000)}
              </MinTimeRemaining>
            )}
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
              <Button primary label="Confirm Cancellation" onClick={cancel} disabled={disabled} />
            </Box>
          </>
        )}
      </Info>

      {!epochData?.isBlockedState && !confirmCancellation && (
        <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
          <Button primary label="Cancel Order" onClick={() => setConfirmCancellation(true)} disabled={disabled} />
          {/* <Button primary label="Update Order" /> */}
        </Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(OrderCard)
