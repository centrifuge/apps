import Centrifuge, {
  computeTrancheId,
  getCurrencyLocation,
  PoolMetadata,
  TransactionOptions,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  useCentEvmChainId,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Card,
  Divider,
  IconInfo,
  InputErrorMessage,
  SelectInner,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { isAddress as isSubstrateAddress } from '@polkadot/util-crypto'
import { BN } from 'bn.js'
import { isAddress as isEvmAddress } from 'ethers'
import { ErrorMessage, Field, FieldArray, FieldProps, FormikErrors, setIn, useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, firstValueFrom, switchMap } from 'rxjs'
import { FormAddressInput } from '../../../../src/pages/IssuerCreatePool/FormAddressInput'
import { parachainNames } from '../../../config'
import { diffPermissions } from '../../../pages/IssuerPool/Configuration/Admins'
import { looksLike } from '../../../utils/helpers'
import { useIdentity } from '../../../utils/useIdentity'
import { useDomainRouters } from '../../../utils/useLiquidityPools'
import { getKeyForReceiver, usePoolAccess, usePoolAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { address } from '../../../utils/validation'
import { FieldWithErrorMessage } from '../../FieldWithErrorMessage'
import type { FormHandle } from '../AccessDrawer'

export type AOFormValues = {
  withdrawAddresses: WithdrawAddress[]
  delegates: string[]
}

export function AssetOriginators({
  poolId,
  handle,
  account,
}: {
  poolId: string
  handle: React.RefObject<FormHandle>
  account: CombinedSubstrateAccount
}) {
  const access = usePoolAccess(poolId)
  const {
    proxy: { proxyDepositBase, proxyDepositFactor },
  } = useCentrifugeConsts()
  const poolAdmin = usePoolAdmin(poolId)

  const { execute: createAO, isLoading: createAOIsPending } = useCentrifugeTransaction(
    'Create asset originator',
    (cent) => (_args: [], options?: TransactionOptions) => {
      return combineLatest([
        cent.getApi(),
        cent.proxies.createPure([], { batch: true }),
        cent.pools.updatePoolRoles([poolId, access.missingAdminPermissions, []], { batch: true }),
      ]).pipe(
        switchMap(([api, createTx, permissionTx]) => {
          const tx = api.tx.utility.batchAll([
            ...permissionTx.method.args[0],
            api.tx.balances.transferKeepAlive(account.actingAddress, proxyDepositBase.add(proxyDepositFactor)),
            createTx,
          ])
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    }
  )

  const ao = access.assetOriginators[0]

  return ao ? (
    <AOForm access={access} assetOriginator={ao} poolId={poolId} handle={handle} account={account} />
  ) : (
    <Button
      variant="secondary"
      onClick={() => createAO([], { account: poolAdmin })}
      small
      loading={createAOIsPending}
      disabled={!poolAdmin}
    >
      Create Asset Originator
    </Button>
  )
}

type Row = {
  address: string
  index: number
}

function AOForm({
  access,
  assetOriginator: ao,
  poolId,
  handle,
  account,
}: {
  access: ReturnType<typeof usePoolAccess>
  assetOriginator: ReturnType<typeof usePoolAccess>['assetOriginators'][0]
  poolId: string
  handle: React.RefObject<FormHandle>
  account: CombinedSubstrateAccount
}) {
  const chainId = useCentEvmChainId()
  const identity = useIdentity(ao.address)
  const {
    proxy: { proxyDepositFactor },
    uniques: { collectionDeposit },
    transferAllowlist: { receiverDeposit },
  } = useCentrifugeConsts()
  const api = useCentrifugeApi()
  const utils = useCentrifugeUtils()
  const routers = useDomainRouters()
  const pool = usePool(poolId)
  const chainIds = routers?.map((r) => r.chainId) || []
  const getName = useGetNetworkName()
  const form = useFormikContext<AOFormValues>()

  const isLocalAsset = typeof pool.currency.key !== 'string' && 'LocalAsset' in pool.currency.key
  const destinations = [
    'centrifuge',
    ...chainIds
      .map((cid) => ({ evm: cid }))
      .filter(
        (location) =>
          (pool.currency.additional?.transferability &&
            'liquidityPools' in pool.currency.additional.transferability &&
            looksLike(location, getCurrencyLocation(pool.currency))) ||
          isLocalAsset
      ),
    ...Object.keys(parachainNames)
      .map((pid) => ({ parachain: Number(pid) }))
      .filter(
        () =>
          (pool.currency.additional?.transferability && 'xcm' in pool.currency.additional.transferability) ||
          isLocalAsset
      ),
  ]

  const initialValues: AOFormValues = React.useMemo(
    () => ({
      name: identity?.display,
      withdrawAddresses: [
        ...ao.transferAllowlist.map((allowList) => ({ ...allowList, address: utils.formatAddress(allowList.address) })),
        ...new Array(3).fill({}),
      ].slice(0, 3),
      delegates: ao.delegates.map((d) => d.delegatee),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ao, identity]
  )

  const storedAORoles = {
    address: ao.address,
    roles: Object.fromEntries(ao.permissions.roles.map((role) => [role, true])),
  }

  async function getBatch(cent: Centrifuge, values: AOFormValues, metadata: PoolMetadata) {
    const addedDelegates = values.delegates.filter((addr) => !initialValues.delegates.includes(addr))
    const removedDelegates = initialValues.delegates.filter((addr) => !values.delegates.includes(addr))

    const hasChanges =
      form.values.delegates.length !== initialValues.delegates.length ||
      !form.values.delegates.every((s) => initialValues.delegates.includes(s)) ||
      addedWithdraw.length ||
      removedWithdraw.length

    if (!hasChanges) return { batch: [], metadata }

    const addedPermissions = diffPermissions(
      [storedAORoles],
      [{ address: ao.address, roles: { Borrower: true, LoanAdmin: true } }],
      ['Borrower', 'LoanAdmin']
    ).add
    const junTranche = computeTrancheId(0, poolId)
    if (!ao.permissions.tranches[junTranche]) {
      addedPermissions.push([
        ao.address,
        { TrancheInvestor: [junTranche, Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)] } as any,
      ])
    }

    const addedWithdrawAddresses = addedWithdraw
      .filter((w) => Object.keys(w).length !== 0)
      .map((w) => getKeyForReceiver(api, w))
    const removedWithdrawAddresses = removedWithdraw
      .filter((w) => Object.keys(w).length !== 0)
      .map((w) => getKeyForReceiver(api, w))
    const collectionId = !ao.collateralCollections.length ? await cent.nfts.getAvailableCollectionId() : undefined

    const permissionTx = await firstValueFrom(
      cent.pools.updatePoolRoles([poolId, [...access.missingPermissions, ...addedPermissions], []], {
        batch: true,
      })
    )

    const numProxyTypesPerHotWallet = 4
    const deposit = proxyDepositFactor
      .mul(new BN(Math.max(addedDelegates.length - removedDelegates.length, 0) * numProxyTypesPerHotWallet))
      .add(collectionId ? collectionDeposit : new BN(0))
      .add(receiverDeposit.mul(new BN(Math.max(addedWithdrawAddresses.length - removedWithdrawAddresses.length, 0))))

    // doing the proxy and multisig transactions manually, because both the Pool Admin and the AO need to call extrinsics
    const batch = [
      api.tx.proxy.proxy(
        account.proxies![0].delegator,
        undefined,
        api.tx.utility.batchAll(
          [
            // Adding the permissions and metadata needs to be done by the Pool Admin, the rest by the AO
            ...permissionTx.method.args[0],
            api.tx.proxy.proxy(
              account.proxies![1].delegator,
              undefined,
              api.tx.utility.batchAll(
                [
                  removedDelegates.length &&
                    api.tx.utility.batch(
                      removedDelegates
                        .map((addr) => [
                          api.tx.proxy.removeProxy(addr, 'Borrow', 0),
                          api.tx.proxy.removeProxy(addr, 'Invest', 0),
                          api.tx.proxy.removeProxy(addr, 'Transfer', 0),
                          api.tx.proxy.removeProxy(addr, 'PodOperation', 0),
                        ])
                        .flat()
                    ),
                  addedDelegates.map((addr) => [
                    api.tx.proxy.addProxy(addr, 'Borrow', 0),
                    api.tx.proxy.addProxy(addr, 'Invest', 0),
                    api.tx.proxy.addProxy(addr, 'Transfer', 0),
                    api.tx.proxy.addProxy(addr, 'PodOperation', 0),
                  ]),
                  collectionId && [api.tx.uniques.create(collectionId, ao.address)],
                  addedWithdrawAddresses.map((w) => api.tx.transferAllowList.addTransferAllowance('All', w)),
                  removedWithdrawAddresses.map((w) => api.tx.transferAllowList.removeTransferAllowance('All', w)),
                ]
                  .filter(Boolean)
                  .flat(2)
              )
            ),
          ].filter(Boolean)
        )
      ),
    ]

    if (!deposit.isZero()) {
      batch.unshift(api.tx.balances.transferKeepAlive(account.proxies![1].delegator, deposit))
    }

    return { batch, metadata }
  }

  function validate(values: AOFormValues) {
    let errors: FormikErrors<AOFormValues> = {}
    values.withdrawAddresses.forEach((value, index) => {
      if (value.address) {
        if (!value.location) {
          errors = setIn(errors, `withdrawAddresses.${index}.location`, 'Select a destination')
        } else {
          if (typeof value.location !== 'string' && 'evm' in value.location) {
            if (!isEvmAddress(value.address)) {
              errors = setIn(errors, `withdrawAddresses.${index}.address`, 'Not a valid EVM address')
            }
          } else if (!isSubstrateAddress(value.address) || isEvmAddress(value.address)) {
            errors = setIn(errors, `withdrawAddresses.${index}.address`, 'Not a valid Substrate address')
          }
        }
      }
    })
    return errors
  }

  React.useImperativeHandle(handle, () => ({
    getBatch,
    validate,
  }))

  React.useEffect(() => {
    form.setFieldValue('withdrawAddresses', initialValues.withdrawAddresses, false)
    form.setFieldValue('delegates', initialValues.delegates, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const { add: addedWithdraw, remove: removedWithdraw } = diffWithdrawAddresses(
    initialValues.withdrawAddresses.filter((w) => !!w.location),
    form.values.withdrawAddresses.filter((w) => !!w.location)
  )

  console.log('form.values.delegates', form.values.delegates)

  return (
    <Stack gap={3}>
      <Card variant="secondary" px={2} py={2}>
        <Stack gap={2}>
          <Text variant="body2" color="textSecondary">
            Add or remove addresses which can: <br />
            <Text color="textPrimary">
              <b>originate</b> assets and <b>invest</b> in the pool.
            </Text>
          </Text>
          <FieldArray name="delegates">
            {({ push }) => (
              <Stack gap={2}>
                <Stack gap={3}>
                  {form.values.delegates.map((_, index) => (
                    <Field name={`delegates.${index}`} key={index}>
                      {() => (
                        <FormAddressInput
                          name={`delegates.${index}`}
                          placeholder="Enter address..."
                          chainId={chainId}
                        />
                      )}
                    </Field>
                  ))}
                </Stack>
                <Box mt={2}>
                  <Button
                    variant="inverted"
                    onClick={() => {
                      push('')
                    }}
                    small
                  >
                    Add another
                  </Button>
                </Box>
              </Stack>
            )}
          </FieldArray>
        </Stack>
      </Card>
      <Card variant="secondary" px={2} py={2}>
        <Stack gap={2}>
          <Box display="flex">
            <IconInfo size={20} />
            <Text style={{ marginLeft: 8 }}>
              Please select the right address and network. Choosing the wrong address or network will result in loss of
              funds.
            </Text>
          </Box>
          <Divider color="textSecondary" />
          <Text variant="body2" color="textSecondary">
            Add or remove addresses that can: <br />
            <Text color="textPrimary">
              <b>receive funds</b> from the pool.
            </Text>
          </Text>
          <Stack gap={1}>
            {form.values.withdrawAddresses.map((value, index) => (
              <FieldWithErrorMessage
                name={`withdrawAddresses.${index}.address`}
                validate={address()}
                label="Address"
                as={TextInput}
                onChange={(event: any) => {
                  form.setFieldValue(`withdrawAddresses.${index}.key`, undefined, false)
                  form.setFieldValue(`withdrawAddresses.${index}.address`, event.target.value)
                }}
                placeholder={''}
                secondaryLabel={
                  <ErrorMessage
                    name={`withdrawAddresses.${index}.location`}
                    render={(error) => error && <InputErrorMessage>{error}</InputErrorMessage>}
                  />
                }
                symbol={
                  <Field name={`withdrawAddresses.${index}.location`}>
                    {({ field, form }: FieldProps) => (
                      <SelectInner
                        name={`withdrawAddresses.${index}.location`}
                        onChange={(event) =>
                          form.setFieldValue(`withdrawAddresses.${index}.location`, JSON.parse(event.target.value))
                        }
                        onBlur={field.onBlur}
                        value={field.value ? JSON.stringify(field.value) : ''}
                        options={destinations.map((dest) => ({
                          value: JSON.stringify(dest),
                          label:
                            typeof dest === 'string'
                              ? getName(dest as any)
                              : 'parachain' in dest
                              ? parachainNames[dest.parachain]
                              : getName(dest.evm),
                        }))}
                        placeholder="Select..."
                      />
                    )}
                  </Field>
                }
              />
            ))}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}

export function diffWithdrawAddresses(
  storedValues: AOFormValues['withdrawAddresses'],
  formValues: AOFormValues['withdrawAddresses']
) {
  const add: AOFormValues['withdrawAddresses'] = []
  const remove: AOFormValues['withdrawAddresses'] = []

  storedValues.forEach((stored) => {
    if (
      !formValues.find(
        (value) => value?.address && value.address === stored?.address && value?.location === stored?.location
      )
    )
      remove.push(stored)
  })
  formValues.forEach((value) => {
    if (
      value?.address &&
      !storedValues.find((stored) => value?.address === stored?.address && value?.location === stored?.location)
    )
      add.push(value)
  })
  return {
    add,
    remove,
  }
}
