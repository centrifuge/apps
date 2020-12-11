import BN from 'bn.js'

export const seniorToJuniorRatio = (seniorRatio: BN) => {
  return new BN(10).pow(new BN(27)).sub(seniorRatio)
}
