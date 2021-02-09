import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import { Orders, State } from '@centrifuge/tinlake-js/dist/services/solver/solver'
import { NotificationEvent } from './slack'
const BN = require('bn.js')

export const formatEvents = (
  state: State,
  fulfilledOrders: Orders,
  beforeClosing?: boolean,
  currentTinRatio?: number
): NotificationEvent[] => {
  const minTinRatio = parseRatio(new BN(10).pow(new BN(27)).sub(state.maxDropRatio))
  // const reserveRatio = state.reserve.div(state.reserve.add(state.netAssetValue)).mul(new BN(100))

  return [
    {
      icon: 'drop',
      message: `DROP ${beforeClosing ? 'could receive' : 'received'} ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.dropInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.dropRedeem, 18), 0)
      )} DAI ${beforeClosing ? 'could be redeemed' : 'was redeemed'}.`,
    },
    {
      icon: 'tin',
      message: `TIN ${beforeClosing ? 'could receive' : 'received'} ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.tinInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.tinRedeem, 18), 0)
      )} DAI ${beforeClosing ? 'could be redeemed' : 'was redeemed'}.`,
    },
    {
      icon: 'moneybag',
      message: `The reserve is ${addThousandsSeparators(
        toPrecision(baseToDisplay(state.reserve, 18), 0)
      )} DAI out of ${addThousandsSeparators(toPrecision(baseToDisplay(state.maxReserve, 18), 0))} DAI.`,
    },
  ]

  // {
  //   level: 'warning',
  //   message: `The TIN risk buffer is ${Math.round(100 * currentTinRatio)} % (min: ${100 * minTinRatio} %).`,
  // },
}

export const parseRatio = (num: typeof BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}
