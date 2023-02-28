import Centrifuge, { TinlakeContractAddresses } from '@centrifuge/centrifuge-js'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { Observable } from 'rxjs'
import { usePool } from '../usePools'
import { useEvmTransaction } from './useEvmTransaction'
import { TinlakePool } from './useTinlakePools'

export function useTinlakeTransaction<T extends Array<any>>(
  poolId: string,
  title: string,
  transactionCallback: (
    centrifuge: Centrifuge
  ) => (
    contractAddresses: TinlakeContractAddresses,
    args: T,
    options?: TransactionRequest
  ) => Observable<TransactionResponse>,
  options: { onSuccess?: (args: T, result: any) => void; onError?: (error: any) => void } = {}
) {
  const pool = usePool(poolId) as TinlakePool
  return useEvmTransaction(title, (cent) => transactionCallback(cent).bind(null, pool.addresses), options)
}
