import BN from 'bn.js'

export const Fixed27Base = new BN(10).pow(new BN(27))

export const seniorToJuniorRatio = (seniorRatio: BN) => {
  return Fixed27Base.sub(seniorRatio)
}
