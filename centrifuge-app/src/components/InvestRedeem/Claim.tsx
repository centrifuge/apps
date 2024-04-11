import { Button, InlineFeedback, Stack, Text } from '@centrifuge/fabric'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { ButtonGroup } from '../ButtonGroup'
import { useInvestRedeem } from './InvestRedeemProvider'
import { SuccessBanner } from './SuccessBanner'

export function Claim({ type, onDismiss }: { type: 'invest' | 'redeem'; onDismiss?: () => void }) {
  const { state, actions } = useInvestRedeem()
  if (!state.order || !state.collectType) return null

  const isPending =
    !!state.pendingTransaction && ['creating', 'unconfirmed', 'pending'].includes(state.pendingTransaction?.status)
  const isCollecting = state.pendingAction === 'collect' && isPending
  return (
    <Stack gap={2}>
      {state.collectType === 'invest' ? (
        <SuccessBanner
          title="Investment successful"
          body={
            <Stack gap={1}>
              <div>
                Invested {state.poolCurrency?.symbol} value{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutTokenAmount.mul(state.tokenPrice), state.poolCurrency?.symbol)}
                </Text>
              </div>
              <div>
                Token amount{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutTokenAmount, state.trancheCurrency?.symbol)}
                </Text>
              </div>
            </Stack>
          }
        />
      ) : (
        <SuccessBanner
          title="Redemption successful"
          body={
            <Stack gap={1}>
              <div>
                Redeemed{' '}
                <Text fontWeight="bold">
                  {formatBalance(state.order.payoutCurrencyAmount, state.poolCurrency?.symbol)}
                </Text>
              </div>
            </Stack>
          }
        />
      )}
      {state.needsToCollectBeforeOrder && <InlineFeedback>Claim tokens before placing another order</InlineFeedback>}
      <ButtonGroup>
        <Button
          onClick={actions.collect}
          loading={isCollecting}
          aria-label={`Claim ${formatBalanceAbbreviated(
            state.collectAmount,
            state.collectType === 'invest' ? state.trancheCurrency?.symbol : state.poolCurrency?.symbol
          )}`}
        >
          Claim{' '}
          {formatBalanceAbbreviated(
            state.collectAmount,
            state.collectType === 'invest' ? state.trancheCurrency?.symbol : state.poolCurrency?.symbol
          )}
        </Button>
        {!state.needsToCollectBeforeOrder && (
          <Button variant="secondary" onClick={onDismiss}>
            {type === 'invest' ? 'Invest more' : 'Redeem'}
          </Button>
        )}
      </ButtonGroup>
    </Stack>
  )
}
