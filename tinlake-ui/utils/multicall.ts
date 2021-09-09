import { aggregate } from '@makerdao/multicall'
import set from 'lodash/set'
import { multicallConfig } from '../config'

type PostProcess<T = any> = (v: any) => T

type Return = [string] | [string, PostProcess]

export interface Call {
  target: string
  call: (string | number)[]
  returns: Return[]
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
