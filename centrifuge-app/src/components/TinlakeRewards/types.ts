import BN from 'bn.js'

export type TransactionStatus = 'unconfirmed' | 'pending' | 'succeeded' | 'failed'

export type Claim = {
  accountID: string // Hex String AccountID
  balance: BN // BN - Balance should be represented compatibly with our CFG token on chain - 18 decimal points
}

export type Proof = {
  position: 'left' | 'right'
  data: Buffer
}
