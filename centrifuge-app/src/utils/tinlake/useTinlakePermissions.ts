import { useQuery } from 'react-query'
import { useAddress } from '../useAddress'
import { usePool } from '../usePools'
import { Call, multicall } from './multicall'
import { TinlakePool } from './useTinlakePools'

export function useTinlakePermissions(poolId: string, address?: string) {
  const addr = useAddress('evm') || address
  const isTinlakePool = poolId.startsWith('0x')
  const pool = usePool(poolId) as TinlakePool
  return useQuery(['tinlakePermissions', poolId, addr], () => getPermissions(pool, address!), {
    enabled: !!addr && isTinlakePool,
    staleTime: Infinity,
  })
}

async function getPermissions(pool: TinlakePool, address: string) {
  const calls: Call[] = []

  if (pool.addresses.POOL_ADMIN && pool.versions?.POOL_ADMIN && pool.versions.POOL_ADMIN >= 2) {
    calls.push(
      {
        target: pool.addresses.SENIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`senior.inMemberlist`]],
      },
      {
        target: pool.addresses.JUNIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`junior.inMemberlist`]],
      }
    )
  } else if (pool.addresses.POOL_ADMIN) {
    calls.push(
      {
        target: pool.addresses.SENIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`senior.inMemberlist`]],
      },
      {
        target: pool.addresses.JUNIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`junior.inMemberlist`]],
      }
    )
  } else {
    calls.push(
      {
        target: pool.addresses.SENIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`senior.inMemberlist`]],
      },
      {
        target: pool.addresses.JUNIOR_MEMBERLIST,
        call: ['hasMember(address)(bool)', address],
        returns: [[`junior.inMemberlist`]],
      }
    )
  }

  const multicallData = await multicall<State>(calls)

  return multicallData
}

type TrancheState = {
  inMemberlist: boolean
}

type State = {
  junior: TrancheState
  senior: TrancheState
}
