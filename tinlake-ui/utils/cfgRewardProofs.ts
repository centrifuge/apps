import { bnToU8a, hexToU8a, u8aConcat } from '@polkadot/util'
import { blake2AsU8a } from '@polkadot/util-crypto/blake2'
import BN from 'bn.js'
import MerkleTree from 'merkletreejs'

export interface Claim {
  // Hex String AccountID
  accountID: string
  // BN - Balance should be represented compatibly with our CFG token on chain - 18 decimal points
  balance: BN
}

export interface Proof {
  position: 'left' | 'right'
  data: Buffer
}

export function newClaim({ accountID, balance }: { accountID: string; balance: string }): Claim {
  return { accountID, balance: new BN(balance) }
}

export function createTree(claims: Claim[]): MerkleTree {
  const leaves = claims.map((x) => hashLeaf(x.accountID, x.balance))
  return new MerkleTree(leaves, hashBlake2b, { sortPairs: true })
}

export function createProofFromClaim(tree: MerkleTree, claim: Claim): Proof[] {
  return createProofs(tree, hashLeaf(claim.accountID, claim.balance))
}

export function createBufferProofFromClaim(tree: MerkleTree, claim: Claim): Buffer[] {
  return createProofFromClaim(tree, claim).map((x) => x.data)
}

export function createHexProofFromClaim(tree: MerkleTree, claim: Claim): string[] {
  return createBufferProofFromClaim(tree, claim).map((x) => x.toString('hex'))
}

function createProofs(tree: MerkleTree, leaf: Buffer): Proof[] {
  return tree.getProof(leaf)
}

export function verifyProof(tree: MerkleTree, leaf: Buffer, proof: Proof[]): boolean {
  return tree.verify(proof, leaf, tree.getRoot())
}

function hashBlake2b(bytes: string | Uint8Array) {
  return Buffer.from(blake2AsU8a(bytes))
}

export function hashLeaf(accountID: string, balance: BN): Buffer {
  // @ts-ignore
  return hashBlake2b(u8aConcat(hexToU8a(accountID), bnToU8a(balance, 128, true)))
}
