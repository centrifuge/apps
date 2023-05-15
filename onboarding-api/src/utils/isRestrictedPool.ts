const RESTRICTED_POOLS = [
  '0x4597f91cc06687bdb74147c80c097a79358ed29b',
  '0xb5c08534d1e73582fbd79e7c45694cad6a5c5ab2',
  '0x55d86d51ac3bcab7ab7d2124931fba106c8b60c7',
  '0x90040f96ab8f291b6d43a8972806e977631affde',
]

export const isRestrictedPool = (poolAddress: string): boolean => RESTRICTED_POOLS.includes(poolAddress.toLowerCase())
