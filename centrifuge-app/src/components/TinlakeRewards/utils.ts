import { addThousandsSeparators, toPrecision } from '@centrifuge/centrifuge-js'
import { blake2AsU8a } from '@polkadot/util-crypto/blake2'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { MerkleTree } from 'merkletreejs'
import { UserRewardsLink } from '../../utils/tinlake/types'
import { Claim, Proof } from './types'

export function calculateCFGRewards(amount: string | BN) {
  return addThousandsSeparators(toDynamicPrecision(baseToDisplay(amount, 18)))
}

export function calcUnclaimed(link: UserRewardsLink): null | BN {
  if (!link.claimable || !link.claimed) {
    return null
  }
  const unclaimed = link.claimable.sub(link.claimed)
  if (unclaimed.ltn(0)) {
    return new BN(0)
  }
  return unclaimed
}

function baseToDisplay(base: string | BN, decimals: number) {
  let baseStr = typeof base === 'string' ? base : base.toString()
  const neg = baseStr.includes('-')

  baseStr = baseStr.replace(/-/g, '')

  const a = baseStr.slice(0, -decimals) || '0'
  const b = baseStr.slice(-decimals).padStart(decimals, '0')

  const res = `${a}.${b}`

  return neg ? `-${res}` : res
}

function dynamicPrecision(num: string) {
  return new Decimal(num).lt(10) ? 4 : 0
}

function toDynamicPrecision(num: string) {
  return toPrecision(num, dynamicPrecision(num))
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
  return Buffer.from(blake2AsU8a(bytes))
}

function hashLeaf(accountID: string, balance: BN): Buffer {
  // @ts-expect-error
  return hashBlake2b(u8aConcat(hexToU8a(accountID), bnToU8a(balance, 128, true)))
}

function createProofs(tree: MerkleTree, leaf: Buffer): Proof[] {
  return tree.getProof(leaf)
}

function createProofFromClaim(tree: MerkleTree, claim: Claim): Proof[] {
  return createProofs(tree, hashLeaf(claim.accountID, claim.balance))
}

export function createBufferProofFromClaim(tree: MerkleTree, claim: Claim): Buffer[] {
  return createProofFromClaim(tree, claim).map((x) => x.data)
}
