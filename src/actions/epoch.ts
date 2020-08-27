import { Constructor, TinlakeParams } from '../Tinlake'
import BN from 'bn.js'

export function EpochActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IEpochActions {
    solveEpoch = async () => {
        const tinlake = (this as any)

        const reserve = (await tinlake.getJuniorReserve()).add(await tinlake.getSeniorReserve())

        const state = {
          reserve,
          netAssetValue: 0,
          seniorDebt: await tinlake.getSeniorDebt(),
          seniorBalance: 0,
          minTinRatio: await tinlake.getMinJuniorRatio(),
          maxTinRatio: 0,
          maxReserve: 0,
        }

        console.log('state', state)

        return Promise.resolve({
            tinRedeem: 1,
            dropRedeem: 2,
            tinInvest: 3,
            dropInvest: 4
        })
    }
  }
}

export type IEpochActions = {
  solveEpoch(): Promise<SolverSolution>
}

export default EpochActions

interface BaseState {
  netAssetValue: BN
  reserve: BN
  seniorDebt: BN
  seniorBalance: BN
}

export interface State extends BaseState {
  netAssetValue: BN
  reserve: BN
  seniorDebt: BN
  seniorBalance: BN
  minTinRatio: BN
  maxTinRatio: BN
  maxReserve: BN
}

export interface OrderState {
  tinRedeemOrder: number
  dropRedeemOrder: number
  tinInvestOrder: number
  dropInvestOrder: number
}

export interface SolverSolution {
  tinRedeem: number
  dropRedeem: number
  tinInvest: number
  dropInvest: number
}
