import { aggregate } from '@makerdao/multicall'
import set from 'lodash/set'
import { ethConfig } from '../../config'

type PostProcess<T = any> = (v: any) => T

type Return = [string] | [string, PostProcess]

export type Call = {
  target: string
  call: (string | number)[]
  returns: Return[]
}

export const multicallConfig = {
  rpcUrl: ethConfig.rpcUrl,
  multicallAddress: ethConfig.multicallContractAddress,
  interval: 60000,
}

export async function multicall<T = any>(calls: Call[]): Promise<T> {
  const {
    results: { transformed: multicallData },
  } = await aggregate(calls, multicallConfig)

  const transformed = Object.entries(multicallData).reduce((obj, [type, value]) => {
    set(obj, type, value)
    return obj
  }, {} as any)

  return transformed
}
