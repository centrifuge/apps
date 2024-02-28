import { Claim } from './types'
import { createBufferProofFromClaim, createProofFromClaim, createTree, hashLeaf, verifyProof } from './utils'
const BN = require('bn.js')

describe('Tinlake Rewards Proofs', () => {
  it('should be able to create proofs correctly', () => {
    const claim0: Claim = {
      accountID: '0xe0505d9eb1fd7c06c1396c655bb78448e4b469812a9c2a2bfed1089bb21c5b47',
      balance: new BN('100000000000000000000', 10), // 100 CFG
    }
    const claim1: Claim = {
      accountID: '0x085ef2a683e8b2bd4db4be08ba0617ed19989c38a6afd9265b4517944647b112',
      balance: new BN('201000000000000000000', 10),
    }
    const claim2: Claim = {
      accountID: '0x02c451256605c7bcec9dcc4e0fd7aaa589672e4ff8a433bf5630dd9d40685502',
      balance: new BN('301000000000000000000', 10),
    }
    const claim3: Claim = {
      accountID: '0xaaf166d4a5771686aedf556b66a484d16864b2aeed2bcf8e4f29ab2ec5041c3a',
      balance: new BN('401000000000000000000', 10),
    }
    const claim4: Claim = {
      accountID: '0x94489d88cd8e43777a2bd74a189354afdb96a8f9fe52f1a556378fb04721230a',
      balance: new BN('501000000000000000000', 10),
    }
    const claim5: Claim = {
      accountID: '0x5c84a8d5a2d754eae104115c769b385c9334fba7084cf761fbd0d688b795e903',
      balance: new BN('601000000000000000000', 10),
    }
    const claim6: Claim = {
      accountID: '0x0a2cec550b92cc3f1de2e15edc085dc47bb8d7c3978457c61add02e3e1eebb76',
      balance: new BN('701000000000000000000', 10),
    }
    const claim7: Claim = {
      accountID: '0x5692727ec3ceacea7553a7787304fcb66dee75cc52ff7959ab53634ed5e14f5c',
      balance: new BN('801000000000000000000', 10),
    }
    const claim8: Claim = {
      accountID: '0xc622f88f92f1d2c15293a8b1e7733b81198cbc99ed131c58761abf2ad365f72b',
      balance: new BN('901000000000000000000', 10),
    }
    const claim9: Claim = {
      accountID: '0xd6c50e8575dd364b5cbdde6610356e9a02a3ee0c42f7f867cce4ca9d36f1d87b',
      balance: new BN('1001000000000000000000', 10),
    }
    const claims: Claim[] = [claim0, claim1, claim2, claim3, claim4, claim5, claim6, claim7, claim8, claim9]
    const tree = createTree(claims)

    const leaf = hashLeaf(claim0.accountID, claim0.balance)
    const proof = createProofFromClaim(tree, claim0)
    expect(proof.length).toEqual(4)
    const proofArray = createBufferProofFromClaim(tree, claim0)
    expect(proofArray.length).toEqual(4)
    expect(tree.getHexRoot()).toEqual('0xb86441971a590bb28da204c422f8f90e5bdbe4eed7149c489be23b534f8eff6b')
    expect(verifyProof(tree, leaf, proof)).toBeTruthy()
  })
})
