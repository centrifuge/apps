import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { bnToU8a, hexToU8a, u8aConcat } from '@polkadot/util'
import { blake2AsHex } from '@polkadot/util-crypto/blake2'
import BN from 'bn.js'
import { MerkleTree } from 'merkletreejs'
import { UserRewardsLink } from '../../utils/tinlake/types'
import { Claim, Proof } from './types'

export function calcUnclaimed(link: UserRewardsLink) {
  if (!link.claimable || !link.claimed) {
    return null
  }
  const unclaimed = link.claimable.sub(link.claimed)
  if (unclaimed.ltn(0)) {
    return new CurrencyBalance(0, 18)
  }
  return new CurrencyBalance(unclaimed, 18)
}

export function newClaim({ accountID, balance }: { accountID: string; balance: string }): Claim {
  return { accountID, balance: new BN(balance) }
}

export function createTree(claims: Claim[]): MerkleTree {
  const uniqueClaims = claims.reduce((acc: Claim[], currentClaim) => {
    const claim = acc.find((item) => item.accountID === currentClaim.accountID)
    if (!claim) {
      return acc.concat([currentClaim])
    }
    return acc
  }, [])

  const leaves = uniqueClaims.map((claim) => hashLeaf(claim.accountID, claim.balance))
  return new MerkleTree(leaves, hashBlake2b, { sortPairs: true })
}

function hashBlake2b(bytes: string | Uint8Array) {
  return blake2AsHex(bytes)
}

export function hashLeaf(accountID: string, balance: BN) {
  return hashBlake2b(u8aConcat(hexToU8a(accountID), bnToU8a(balance, { bitLength: 128 })))
}

function createProofs(tree: MerkleTree, leaf: Buffer | string) {
  return tree.getProof(leaf)
}

export function createProofFromClaim(tree: MerkleTree, claim: Claim) {
  return createProofs(tree, hashLeaf(claim.accountID, claim.balance))
}

export function createBufferProofFromClaim(tree: MerkleTree, claim: Claim): Buffer[] {
  return createProofFromClaim(tree, claim).map((x) => x.data)
}

export function verifyProof(tree: MerkleTree, leaf: Buffer | string, proof: Proof[]): boolean {
  return tree.verify(proof, leaf, tree.getRoot())
}
