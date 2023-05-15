const RESTRICTED_POOLS = [
  '0x4597f91cc06687bdb74147c80c097a79358ed29b', // BlockTower Series 1
  '0xb5c08534d1e73582fbd79e7c45694cad6a5c5ab2', // BlockTower Series 2
  '0x90040f96ab8f291b6d43a8972806e977631affde', // BlockTower Series 3
  '0x55d86d51ac3bcab7ab7d2124931fba106c8b60c7', // BlockTower Series 4
]

export const isRestrictedPool = (poolAddress: string): boolean => RESTRICTED_POOLS.includes(poolAddress.toLowerCase())
