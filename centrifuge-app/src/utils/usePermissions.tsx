import {
  addressToHex,
  Collection,
  computeMultisig,
  evmToSubstrateAddress,
  PoolRoles,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  truncateAddress,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeUtils,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { Select } from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { ApiRx } from '@polkadot/api'
import { blake2AsHex } from '@polkadot/util-crypto/blake2'
import * as React from 'react'
import { combineLatest, combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs'
import { diffPermissions } from '../pages/IssuerPool/Configuration/Admins'
import { useCollections } from './useCollections'
import { useLoan } from './useLoans'
import { usePool, usePoolMetadata, usePools } from './usePools'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getUserPermissions([address!]), {
    enabled: !!address,
  })
  return result
}

export function usePoolPermissions(poolId?: string) {
  const [result] = useCentrifugeQuery(['poolPermissions', poolId], (cent) => cent.pools.getPoolPermissions([poolId!]), {
    enabled: !!poolId,
  })

  return result
}

export function useUserPermissionsMulti(addresses: string[], options?: { enabled?: boolean }) {
  const [result] = useCentrifugeQuery(
    ['permissionsMulti', ...addresses],
    (cent) => cent.pools.getUserPermissions([addresses]),
    {
      enabled: !!addresses.length && options?.enabled !== false,
    }
  )
  return result
}

// Better name welcomed lol
export function usePoolsThatAnyConnectedAddressHasPermissionsFor() {
  const {
    substrate: { combinedAccounts, proxiesAreLoading },
  } = useWallet()
  const actingAddresses = [...new Set(combinedAccounts?.map((acc) => acc.actingAddress))]
  const permissionsResult = useUserPermissionsMulti(actingAddresses, { enabled: !proxiesAreLoading })

  const poolIds = new Set(
    permissionsResult
      ?.map((permissions) =>
        Object.entries(permissions?.pools || {}).map(([poolId, roles]) => (roles.roles.length ? poolId : []))
      )
      .flat(2)
  )

  const pools = usePools(false)
  const filtered = pools?.filter((p) => poolIds.has(p.id))

  return filtered
}

// Returns whether the connected address can borrow from a pool in principle
export function useCanBorrow(poolId: string) {
  const [account] = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['Borrow'] })
  return !!account
}

// Returns whether the connected address can borrow against a specific asset from a pool
export function useCanBorrowAsset(poolId: string, assetId: string) {
  return !!useBorrower(poolId, assetId)
}
export function useBorrower(poolId: string, assetId: string) {
  const loan = useLoan(poolId, assetId)
  const borrower = loan && 'borrower' in loan ? loan?.borrower : ''
  return useSuitableAccounts({
    poolId,
    poolRole: ['Borrower'],
    actingAddress: [borrower],
    proxyType: ['Borrow'],
  }).at(0)
}

export function usePoolAdmin(poolId: string) {
  return useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })[0]
}

type SuitableConfig = {
  actingAddress?: string[]
  poolId?: string
  poolRole?: (PoolRoles['roles'][0] | { trancheInvestor: string })[]
  proxyType?: string[] | ((accountProxyTypes: string[]) => boolean)
}

export function useSuitableAccountPicker(config: SuitableConfig) {
  const accounts = useSuitableAccounts(config)
  const [account, setAccount] = React.useState<CombinedSubstrateAccount | undefined>(accounts[0])
  const utils = useCentrifugeUtils()

  const pickerElement =
    accounts?.length > 1 ? (
      <Select
        label="Select acting account"
        options={accounts.map((acc, i) => ({
          label: `${truncateAddress(utils.formatAddress(acc.actingAddress))}`,
          value: i.toString(),
        }))}
        onChange={(e) => {
          setAccount(accounts[Number(e.target.value)])
        }}
      />
    ) : null

  return [account, pickerElement, accounts] as const
}

export function useSuitableAccounts(config: SuitableConfig) {
  const { actingAddress, poolId, poolRole, proxyType } = config
  const {
    isEvmOnSubstrate,
    substrate: { selectedAccount, combinedAccounts, evmChainId },
    evm: { selectedAddress },
  } = useWallet()
  const signingAddress = isEvmOnSubstrate
    ? evmToSubstrateAddress(selectedAddress!, evmChainId!)
    : selectedAccount?.address
  const permissions = usePoolPermissions(poolId)
  const accounts = (combinedAccounts ?? [])?.filter((acc) => {
    if (acc.signingAccount.address !== signingAddress) return false
    if (actingAddress && !actingAddress.includes(acc.actingAddress)) return false
    if (
      acc.proxies &&
      !acc.proxies.every(
        (p) =>
          p.types.includes('Any') ||
          (proxyType &&
            (typeof proxyType === 'function' ? proxyType(p.types) : p.types.some((t) => proxyType.includes(t))))
      )
    )
      return false

    if (
      poolRole &&
      !poolRole.some((role) =>
        typeof role === 'string'
          ? permissions?.[acc.actingAddress]?.roles.includes(role)
          : !!permissions?.[acc.actingAddress]?.tranches[role.trancheInvestor]
      )
    )
      return false

    return true
  })

  return accounts
}

export function usePoolAccess(poolId: string) {
  const {
    substrate: { proxies },
  } = useWallet()
  const poolPermissions = usePoolPermissions(poolId)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const multisig = metadata?.adminMultisig && computeMultisig(metadata?.adminMultisig)
  const [admin, adminPermissions] =
    (poolPermissions &&
      Object.entries(poolPermissions).find(([, poolRoles]) => poolRoles.roles.includes('PoolAdmin'))) ||
    []
  const aoProxies = (admin && proxies?.[admin]?.filter((p) => p.types.includes('Any')).map((p) => p.delegator)) || []
  const collections = useCollections()
  const api = useCentrifugeApi()

  const aoCollateralCollections: Record<string, Collection[]> = {}
  aoProxies.forEach((ao) => {
    aoCollateralCollections[ao] = (collections || [])?.filter((col) => col.issuer === ao)
  })

  const [isAoSetUp] = useCentrifugeQuery(
    ['aoSetup', aoProxies],
    (cent) => {
      const $events = cent.getEvents().pipe(
        filter(({ api, events }) => {
          const event = events.find(({ event }) => api.events.keystore.KeyAdded.is(event))
          return !!event
        })
      )
      return cent.getApi().pipe(
        switchMap((api) => combineLatest(aoProxies.map((addr) => api.query.keystore.keys.entries(addr)))),
        map((keyData) => {
          const values = (keyData as any[]).map((data) => data.length > 0)
          return values
        }),
        repeatWhen(() => $events)
      )
    },
    {
      enabled: !!aoProxies.length,
    }
  )
  const [transferAllowlists] = useCentrifugeQuery(
    ['aoTransferAllowlist', aoProxies],
    (cent) => {
      const $events = cent.getEvents().pipe(
        filter(({ api, events }) => {
          const event = events.find(
            ({ event }) =>
              api.events.transferAllowList.TransferAllowanceCreated.is(event) ||
              api.events.transferAllowList.TransferAllowanceRemoved.is(event) ||
              api.events.transferAllowList.TransferAllowancePurged.is(event)
          )
          return !!event
        })
      )
      return cent.getApi().pipe(
        switchMap((api) =>
          combineLatest(
            aoProxies.map((addr) =>
              api.query.transferAllowList.accountCurrencyTransferAllowance.entries(addr, pool.currency.key)
            )
          )
        ),
        combineLatestWith(cent.getBlocks().pipe(take(1))),
        map(([data, block]) => {
          return data.map((entries) =>
            entries
              .map(([keyData, valueData]) => {
                const key = (keyData.toHuman() as any)[2]
                const value = valueData.toPrimitive() as { blockedAt: number }
                const blockNumber = block.block.header.number.toNumber()
                if (blockNumber > value.blockedAt) return null as never
                if ('Local' in key) {
                  return {
                    Local: addressToHex(key.Local),
                  }
                } else if ('Address' in key) {
                  if ('EVM' in key.Address)
                    return {
                      Address: {
                        EVM: [Number(key.Address.EVM[0].replace(/\D/g, '')), key.Address.EVM[1].toLowerCase()],
                      },
                    }
                }
                return key
              })
              .filter(Boolean)
          )
        }),
        repeatWhen(() => $events)
      )
    },
    {
      enabled: !!aoProxies.length,
    }
  )

  const combinedAllowLists = React.useMemo(() => {
    return transferAllowlists?.map((aoList, i) => {
      const addr = aoProxies[i]
      const receiversMeta = metadata?.pool?.assetOriginators?.[addr]?.withdrawAddresses
      return aoList.map((key) => ({
        key,
        meta: receiversMeta?.find((receiver) => looksLike(key, getKeyForReceiver(api, receiver))),
      }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferAllowlists, metadata])

  const [delegates] = useCentrifugeQuery(
    ['proxyDelegates', [admin, ...aoProxies]],
    (cent) => {
      const addresses = [admin!, ...aoProxies]
      return cent.getApi().pipe(
        switchMap((api) => api.queryMulti(addresses.map((addr) => [api.query.proxy.proxies, addr]))),
        map((proxiesData) => {
          const values = (proxiesData as any[]).map((data) => data[0].toJSON())

          const result: { delegator: string; delegatee: string; types: string[] }[][] = []
          addresses.forEach((delegator, i) => {
            const proxiesByDelegate: Record<string, { delegator: string; delegatee: string; types: string[] }> = {}
            const delegates = values[i]
            delegates.forEach((node: any) => {
              const delegatee = addressToHex(node.delegate)
              if (delegatee === admin) return
              if (proxiesByDelegate[delegatee]) {
                proxiesByDelegate[delegatee].types.push(node.proxyType)
              } else {
                proxiesByDelegate[delegatee] = {
                  delegator,
                  delegatee,
                  types: [node.proxyType],
                }
              }
            })
            result.push(Object.values(proxiesByDelegate))
          })

          return result
        })
      )
    },
    {
      enabled: !!aoProxies.length && !!admin,
    }
  )

  const [adminDelegates, aoDelegates] = React.useMemo(() => {
    const [adminDelegates, ...aoDelegates] = delegates ?? []
    return [adminDelegates, aoDelegates]
  }, [delegates])

  const storedAdminRoles = {
    address: admin || '',
    roles: Object.fromEntries(adminPermissions?.roles.map((role) => [role, true]) || []),
  }

  const storedManagerPermissions = poolPermissions
    ? Object.entries(poolPermissions)
        .filter(
          ([addr, p]) =>
            p.roles.length &&
            (multisig?.signers
              ? multisig.signers.includes(addr)
              : adminDelegates?.find((p) => p.types.includes('Any') && p.delegatee === addr))
        )
        .map(([address, permissions]) => ({
          address,
          roles: Object.fromEntries(permissions.roles.map((role) => [role, true])),
        }))
    : []
  const missingAdminPermissions = diffPermissions(
    [storedAdminRoles],
    [{ address: storedAdminRoles.address, roles: { InvestorAdmin: true } }]
  ).add
  const missingManagerPermissions = diffPermissions(
    storedManagerPermissions,
    (multisig?.signers || adminDelegates?.map((p) => p.delegatee))?.map((address) => ({
      address,
      roles: { InvestorAdmin: true, LiquidityAdmin: true },
    })) || []
  ).add

  return {
    admin,
    multisig: React.useMemo(
      () => (metadata?.adminMultisig && computeMultisig(metadata.adminMultisig)) || null,
      [metadata?.adminMultisig]
    ),
    adminPermissions,
    missingPermissions: [...missingAdminPermissions, ...missingManagerPermissions],
    missingAdminPermissions,
    missingManagerPermissions,
    assetOriginators: React.useMemo(
      () =>
        aoProxies.map((addr, i) => ({
          address: addr,
          isSetUp: !!isAoSetUp?.[i],
          collateralCollections: aoCollateralCollections[addr],
          permissions: poolPermissions?.[addr] || { roles: [], tranches: {} },
          delegates: aoDelegates?.[i]?.filter((p) => !p.types.includes('PodOperation')) || [],
          transferAllowlist: combinedAllowLists?.[i] || [],
        })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [collections, aoDelegates, isAoSetUp, poolPermissions, combinedAllowLists]
    ),
  }
}
export type WithdrawKey = ReturnType<typeof getKeyForReceiver>
export function getKeyForReceiver(api: ApiRx, receiver: WithdrawAddress) {
  if (typeof receiver.location === 'string') {
    return {
      Local: addressToHex(receiver.address),
    }
  } else if ('parachain' in receiver.location) {
    const type = api.createType('MultiLocation', {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: receiver.location.parachain,
          },
          isEvmAddress(receiver.address)
            ? {
                AccountKey20: {
                  network: null,
                  key: receiver.address.toLowerCase(),
                },
              }
            : {
                AccountId32: {
                  id: addressToHex(receiver.address),
                },
              },
        ],
      },
    })
    const hash = blake2AsHex(type.toU8a(), 256)
    return {
      XCM: hash,
    }
  } else if ('evm' in receiver.location) {
    return {
      Address: {
        EVM: [receiver.location.evm, receiver.address],
      },
    }
  }
}

function looksLike(a: any, b: any): boolean {
  return isPrimitive(b)
    ? b === a
    : Object.keys(b).every((bKey) => {
        const bVal = b[bKey]
        const aVal = a?.[bKey]
        if (typeof bVal === 'function') {
          return bVal(aVal)
        }
        return looksLike(aVal, bVal)
      })
}

function isPrimitive(val: any): val is boolean | string | number | null | undefined {
  return val == null || /^[sbn]/.test(typeof val)
}
