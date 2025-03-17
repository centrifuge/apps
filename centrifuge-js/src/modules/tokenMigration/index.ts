import BN from 'bn.js'
import { Contract, Interface, Provider, TransactionRequest, TransactionResponse } from 'ethers'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../../Centrifuge'

type EvmQueryOptions = {
  rpcProvider?: Provider
}

export const WRAPPER_ADDRESS = '0x8114C3AA5A18dE2fc1678117397EC8072A97072D'
// we are migrating from this contract
export const LEGACY_CFG_ADDRESS = '0x657a4556e60A6097975e2E6dDFbb399E5ee9a58b'
// to this contract
export const NEW_CFG_ADDRESS = '0xC12ca99432048f812AdAd2AA3031941Db6e2bCF7'

export const WRAPPER_ABI = [
  'function depositFor(address account, uint256 value) external returns (bool)',
  'function withdrawTo(address account, uint256 value) external returns (bool)',
]

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
]

export function getTokenMigrationModule(inst: Centrifuge) {
  function pending(txPromise: Promise<TransactionResponse>) {
    return from(txPromise).pipe(
      switchMap((response) => {
        return from(response.wait()).pipe(
          map(() => response),
          startWith(response)
        )
      })
    )
  }

  function contract(contractAddress: string, abi: Interface, options?: EvmQueryOptions) {
    const provider = inst.config.evmSigner ?? options?.rpcProvider
    if (!provider) throw new Error('Needs provider')
    return new Contract(contractAddress, abi, provider)
  }

  function approveForMigration(args: [amount: BN], options: TransactionRequest = {}) {
    const [amount] = args
    return pending(
      contract(LEGACY_CFG_ADDRESS, new Interface(ERC20_ABI)).approve(WRAPPER_ADDRESS, amount.toString(), options)
    )
  }

  function depositForMigration(args: [amount: BN], options: TransactionRequest = {}) {
    const [amount] = args
    const address = inst.config.evmSigner?.address
    return pending(
      contract(WRAPPER_ADDRESS, new Interface(WRAPPER_ABI)).depositFor(address, amount.toString(), options)
    )
  }

  return {
    approveForMigration,
    depositForMigration,
  }
}
