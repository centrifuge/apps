import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import set from 'lodash/set'

const MULTICALL_ABI = [
  // 'function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)',
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  // 'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  // 'function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
  // 'function getBasefee() view returns (uint256 basefee)',
  // 'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
  // 'function getBlockNumber() view returns (uint256 blockNumber)',
  // 'function getChainId() view returns (uint256 chainid)',
  // 'function getCurrentBlockCoinbase() view returns (address coinbase)',
  // 'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
  // 'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
  // 'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
  // 'function getEthBalance(address addr) view returns (uint256 balance)',
  // 'function getLastBlockHash() view returns (bytes32 blockHash)',
  // 'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  // 'function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
]
// Same address on Ethereum, Moonbeam, Base, etc.
const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'

type AggregateOptions = {
  rpcProvider: JsonRpcProvider
  allowFailure?: boolean
}

type PostProcess<T = any> = (v: any) => T

type Return = [string] | [string, PostProcess] | []

export type Call = {
  target: string
  call: (string | number)[]
  returns: Return[]
  allowFailure?: boolean
}

const identity = (v: any) => v
const multicallContracts = new WeakMap<JsonRpcProvider, Contract>()

export async function multicall<T = Record<string, any>>(calls: Call[], options: AggregateOptions) {
  let contract = multicallContracts.get(options.rpcProvider)
  if (!contract) {
    contract = new Contract(MULTICALL_ADDRESS, MULTICALL_ABI, options.rpcProvider)
    multicallContracts.set(options.rpcProvider, contract)
  }

  const interfaces = calls.map((c) => {
    const int = new Interface([c.call[0] as string])
    return [int, int.fragments[0].name] as const
  })
  const encoded = calls.map((c, i) => ({
    target: c.target,
    allowFailure: c.allowFailure ?? options.allowFailure ?? false,
    callData: interfaces[i][0].encodeFunctionData(interfaces[i][1], c.call.slice(1)),
  }))

  const results = await contract.callStatic.aggregate3(encoded)

  const transformed: Record<string, any> = {}
  calls.forEach((c, i) => {
    const { returnData, success } = results[i]
    if (!success) return
    const [int, name] = interfaces[i]
    const parsed = int.decodeFunctionResult(name, returnData)
    parsed.forEach((value, j) => {
      const [key, transform] = c.returns[j] ?? []
      if (!key) return
      set(transformed, key, (transform ?? identity)(value))
    })
  })

  return transformed as T
}
