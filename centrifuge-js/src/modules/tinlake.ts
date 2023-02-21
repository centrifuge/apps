import { Contract } from '@ethersproject/contracts'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { abis } from './tinlake/abi'

const contracts: Record<string, Contract> = {}

// export interface TransactionResponse2 extends Transaction2 {
// 	hash: string;

// 	// Only if a transaction has been mined
// 	blockNumber?: number,
// 	blockHash?: string,
// 	timestamp?: number,

// 	confirmations: number,

// 	// Not optional (as it is in Transaction)
// 	from: string;

// 	// The raw transaction
// 	raw?: string,

// 	// This function waits until the transaction has been mined
// 	wait: (confirmations?: number) => Promise<TransactionReceipt>
// };

// export interface TransactionReceipt2 {
// 	to: string;
// 	from: string;
// 	contractAddress: string,
// 	transactionIndex: number,
// 	root?: string,
// 	gasUsed: BigNumber,
// 	logsBloom: string,
// 	blockHash: string,
// 	transactionHash: string,
// 	logs: Array<Log>,
// 	blockNumber: number,
// 	confirmations: number,
// 	cumulativeGasUsed: BigNumber,
// 	effectiveGasPrice: BigNumber,
// 	byzantium: boolean,
// 	type: number;
// 	status?: number
// };

export type TinlakeContractNames = keyof typeof abis
export type TinlakeContractAddresses = Record<TinlakeContractNames, string>

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export function getTinlakeModule(inst: Centrifuge) {
  function contract(contractAddresses: TinlakeContractAddresses, name: TinlakeContractNames) {
    const contractAddress = contractAddresses[name]
    const abi = abis[name]
    if (!inst.config.evmSigner) throw new Error('Needs signer')
    if (!abi) throw new Error('ABI not found')
    if (!contracts[contractAddress]) {
      contracts[contractAddress] = new Contract(contractAddress, abi)
    }

    return contracts[contractAddress].connect(inst.config.evmSigner)
  }

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

  function approveTrancheForCurrency(
    contractAddresses: TinlakeContractAddresses,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, 'TINLAKE_CURRENCY').approve(
        contractAddresses[tranche === 'junior' ? 'JUNIOR_TRANCHE' : 'SENIOR_TRANCHE'],
        maxUint256,
        options
      )
    )
  }

  function approveTrancheToken(
    contractAddresses: TinlakeContractAddresses,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, tranche === 'junior' ? 'JUNIOR_TOKEN' : 'SENIOR_TOKEN').approve(
        contractAddresses[tranche === 'junior' ? 'JUNIOR_TRANCHE' : 'SENIOR_TRANCHE'],
        maxUint256,
        options
      )
    )
  }

  function updateInvestOrder(
    contractAddresses: TinlakeContractAddresses,
    args: [tranche: 'senior' | 'junior', order: BN],
    options: TransactionRequest = {}
  ) {
    const [tranche, order] = args
    return pending(
      contract(contractAddresses, tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR').supplyOrder(
        order.toString(),
        options
      )
    )
  }

  function updateRedeemOrder(
    contractAddresses: TinlakeContractAddresses,
    args: [tranche: 'senior' | 'junior', order: BN],
    options: TransactionRequest = {}
  ) {
    const [tranche, order] = args
    return pending(
      contract(contractAddresses, tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR').redeemOrder(
        order.toString(),
        options
      )
    )
  }

  function collect(
    contractAddresses: TinlakeContractAddresses,
    args: [tranche: 'senior' | 'junior'],
    options: TransactionRequest = {}
  ) {
    const [tranche] = args
    return pending(
      contract(contractAddresses, tranche === 'junior' ? 'JUNIOR_OPERATOR' : 'SENIOR_OPERATOR')['disburse()'](options)
    )
  }

  return {
    updateInvestOrder,
    updateRedeemOrder,
    approveTrancheForCurrency,
    approveTrancheToken,
    collect,
  }
}
