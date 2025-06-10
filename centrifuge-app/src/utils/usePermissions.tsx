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
  Network,
  truncateAddress,
  useCentrifugeQuery,
  useCentrifugeUtils,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { Select } from '@centrifuge/fabric'
import { ApiRx } from '@polkadot/api'
import { isAddress } from '@polkadot/util-crypto'
import { isAddress as isEvmAddress } from 'ethers'
import * as React from 'react'
import { combineLatest, combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs'
import { useCollections } from './useCollections'
import { useLoan } from './useLoans'
import { usePool, usePoolMetadata, usePools } from './usePools'
import { usePoolFeeders } from './usePoolsForWhichAccountIsFeeder'

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
  const { poolsByFeeder } = usePoolFeeders()
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

  const feederPoolIds = new Set(actingAddresses.flatMap((address) => poolsByFeeder[address] || []))

  const pools = usePools(false)
  const filtered = pools?.filter((p) => poolIds.has(p.id) || feederPoolIds.has(p.id))

  return filtered
}

export const useFilterPoolsByUserRole = (roles: PoolRoles['roles'][0][]) => {
  const {
    substrate: { combinedAccounts, proxiesAreLoading },
  } = useWallet()
  const actingAddresses = [...new Set(combinedAccounts?.map((acc) => acc.actingAddress))]
  const permissionsResult = useUserPermissionsMulti(actingAddresses, { enabled: !proxiesAreLoading })

  const ids = new Set(
    permissionsResult
      ?.map((permissions) =>
        Object.entries(permissions?.pools || {})
          .filter(([poolId, rolesObj]) => {
            const rolesArray = rolesObj.roles || []
            return roles.some((role) => rolesArray.includes(role))
          })
          .map(([poolId]) => poolId)
      )
      .flat()
  )
  const pools = usePools(false)
  const filtered = pools?.filter((p) => ids.has(p.id))

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

  const aoCollateralCollections: Record<string, Collection[]> = {}
  aoProxies.forEach((ao) => {
    aoCollateralCollections[ao] = (collections || [])?.filter((col) => col.issuer === ao)
  })

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
            aoProxies.map((addr) => api.query.transferAllowList.accountCurrencyTransferAllowance.entries(addr, 'All'))
          )
        ),
        combineLatestWith(cent.getBlocks().pipe(take(1))),
        map(([data, block]) => {
          return data.map(
            (entries) =>
              entries
                .map(([keyData, valueData]) => {
                  const key = (keyData.toHuman() as any)[2]
                  const value = valueData.toPrimitive() as { blockedAt: number }
                  const blockNumber = block.block.header.number.toNumber()

                  if (blockNumber > value.blockedAt) return null as never
                  if ('Local' in key) {
                    return {
                      address: addressToHex(key.Local),
                      location: 'centrifuge',
                    }
                  } else if ('Address' in key) {
                    if ('Evm' in key.Address)
                      return {
                        address: key.Address.Evm[1].toLowerCase(),
                        location: { evm: Number(key.Address.Evm[0].replace(/\D/g, '')) },
                      }
                  } else if ('Xcm' in key) {
                    if (!key.Xcm?.V3?.interior?.X2?.[1]?.AccountId32?.id) {
                      return null as never
                    }
                    return {
                      address: key.Xcm.V3.interior.X2[1].AccountId32.id,
                      location: { parachain: Number(key.Xcm.V3.interior.X2[0].Parachain.replace(/\D/g, '')) },
                    }
                  }
                  return key
                })
                .filter(Boolean) as WithdrawAddress[]
          )
        }),
        repeatWhen(() => $events)
      )
    },
    {
      enabled: !!aoProxies.length,
    }
  )

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
    adminDelegates,
    managerPermissions: storedManagerPermissions,
    missingPermissions: [...missingAdminPermissions, ...missingManagerPermissions],
    missingAdminPermissions,
    missingManagerPermissions,
    assetOriginators: React.useMemo(
      () =>
        aoProxies.map((addr, i) => ({
          address: addr,
          isSetUp: !!aoCollateralCollections[addr].length,
          collateralCollections: aoCollateralCollections[addr],
          permissions: poolPermissions?.[addr] || { roles: [], tranches: {} },
          delegates: aoDelegates?.[i] || [],
          transferAllowlist: transferAllowlists?.[i] || [],
        })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [collections, aoDelegates, poolPermissions, transferAllowlists]
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
    return {
      XCM: {
        V3: {
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
        },
      },
    }
  } else if ('evm' in receiver.location) {
    return {
      Address: {
        EVM: [receiver.location.evm, receiver.address],
      },
    }
  }
}

const roles: AdminRole[] = [
  'PoolAdmin',
  'Borrower',
  'PricingAdmin',
  'LiquidityAdmin',
  'InvestorAdmin',
  'LoanAdmin',
  'PODReadAccess',
]
type AdminRole =
  | 'PoolAdmin'
  | 'Borrower'
  | 'PricingAdmin'
  | 'LiquidityAdmin'
  | 'InvestorAdmin'
  | 'LoanAdmin'
  | 'PODReadAccess'

type Admin = {
  address: string
  roles: { [key in AdminRole]?: boolean }
}

export function diffPermissions(storedValues: Admin[], formValues: Admin[], rolesToCheck = roles) {
  const storedObj = Object.fromEntries(storedValues.map((admin) => [admin.address, admin.roles]))
  const formObj = Object.fromEntries(formValues.map((admin) => [admin.address, admin.roles]))
  const addresses = [...new Set(storedValues.map((a) => a.address).concat(formValues.map((a) => a.address)))]

  const add: [string, AdminRole][] = []
  const remove: [string, AdminRole][] = []

  addresses.forEach((addr) => {
    rolesToCheck.forEach((role) => {
      const stored = !!storedObj[addr]?.[role as AdminRole]
      const value = !!formObj[addr]?.[role as AdminRole]
      if (stored !== value) {
        if (value) {
          add.push([addr, role as AdminRole])
        } else {
          remove.push([addr, role as AdminRole])
        }
      }
    })
  })

  return {
    add,
    remove,
  }
}

const SevenDaysMs = 7 * 24 * 60 * 60 * 1000

export function useInvestorStatus(poolId: string, address: string, network: Network = 'centrifuge') {
  const {
    substrate: { evmChainId: substrateEvmChainId },
  } = useWallet()
  const validator = typeof network === 'number' ? isEvmAddress : isAddress
  const validAddress = validator(address) ? address : undefined
  const utils = useCentrifugeUtils()
  const centAddress =
    validAddress && typeof network === 'number'
      ? utils.evmToSubstrateAddress(address, network)
      : substrateEvmChainId && isEvmAddress(address)
      ? utils.evmToSubstrateAddress(address, substrateEvmChainId)
      : validAddress
  const permissions = usePermissions(centAddress)

  const allowedTranches = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(permissions?.pools[poolId]?.tranches ?? {}).filter(
          ([, permission]) => new Date(permission.permissionedTill).getTime() - Date.now() > SevenDaysMs
        )
      ),
    [permissions, poolId]
  )
  return { allowedTranches, permissions, centAddress, validAddress }
}
