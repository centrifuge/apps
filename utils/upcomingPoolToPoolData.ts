import { PoolData, PoolDataV3 } from '../ducks/pool'
import BN from 'bn.js'
import { Tranche } from '@centrifuge/tinlake-js'
import { UpcomingPool } from '../config'

const emptyTranche: Tranche = {
  availableFunds: new BN(0),
  tokenPrice: new BN(0),
  type: '',
  token: '',
  totalSupply: new BN(0),
  interestRate: new BN(0),
}

const emptyPoolData: PoolData | PoolDataV3 = {
  junior: emptyTranche,
  // senior: emptyTranche,
  availableFunds: new BN(0),
  minJuniorRatio: new BN(0),
  maxJuniorRatio: new BN(0),
  currentJuniorRatio: new BN(0),
  maxReserve: new BN(0),
}

export function upcomingPoolToPooldata(p: UpcomingPool): PoolData {
  return {
    ...emptyPoolData,
    minJuniorRatio: new BN(p.presetValues.minimumJuniorRatio || 0),
    senior: {
      ...emptyTranche,
      interestRate: new BN(p.presetValues.seniorInterestRate || 0),
    },
  }
}
