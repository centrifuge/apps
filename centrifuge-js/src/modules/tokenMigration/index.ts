import BN from 'bn.js'
import { Contract, Interface, Provider, TransactionRequest, TransactionResponse } from 'ethers'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../../Centrifuge'

type EvmQueryOptions = {
  rpcProvider?: Provider
}

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

  function approveForMigration(
    args: [amount: BN, legacyAddress: string, wrapperAddress: string],
    options: TransactionRequest = {}
  ) {
    const [amount, legacyAddress, wrapperAddress] = args
    return pending(
      contract(legacyAddress, new Interface(ERC20_ABI)).approve(wrapperAddress, amount.toString(), options)
    )
  }

  function depositForMigration(args: [amount: BN, wrapperAddress: string], options: TransactionRequest = {}) {
    const [amount, wrapperAddress] = args
    const address = inst.config.evmSigner?.address
    return pending(contract(wrapperAddress, new Interface(WRAPPER_ABI)).depositFor(address, amount.toString(), options))
  }

  return {
    approveForMigration,
    depositForMigration,
  }
}
