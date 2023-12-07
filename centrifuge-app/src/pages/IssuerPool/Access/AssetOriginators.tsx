import {
  addressToHex,
  computeTrancheId,
  isSameAddress,
  PoolMetadata,
  TransactionOptions,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import { Box, Button, IconMinusCircle, Select, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress as isSubstrateAddress, sortAddresses } from '@polkadot/util-crypto'
import { BN } from 'bn.js'
import { Field, FieldArray, FieldProps, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { useDebugFlags } from '../../../components/DebugFlags'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Identity } from '../../../components/Identity'
import { PageSection } from '../../../components/PageSection'
import { parachainNames } from '../../../config'
import { useIdentity } from '../../../utils/useIdentity'
import { useDomainRouters } from '../../../utils/useLiquidityPools'
import { getKeyForReceiver, usePoolAccess, useSuitableAccounts, WithdrawKey } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { address, required } from '../../../utils/validation'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import { diffPermissions } from '../Configuration/Admins'
import { CreatePodAccount } from './CreatePodAccount'

type AOFormValues = {
  withdrawAddresses: { key?: any; meta?: WithdrawAddress }[]
  name?: string
  delegates: string[]
  p2pKey: string
  documentKey: string
  podOperator: string
}

export function AssetOriginators({ poolId }: { poolId: string }) {
  const access = usePoolAccess(poolId)
  const {
    proxy: { proxyDepositBase, proxyDepositFactor },
  } = useCentrifugeConsts()

  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'], actingAddress: [access.admin || ''] })

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
            api.tx.balances.transfer(account.actingAddress, proxyDepositBase.add(proxyDepositFactor)),
            createTx,
          ])
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    }
  )

  return (
    <PageSection
      title="Asset originators"
      headerRight={
        <Button
          variant="secondary"
          onClick={() => createAO([], { account })}
          small
          loading={createAOIsPending}
          disabled={!account}
        >
          Create new
        </Button>
      }
    >
      {access.assetOriginators.map((ao) => (
        <AOForm access={access} assetOriginator={ao} poolId={poolId} />
      ))}
    </PageSection>
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
}: {
  access: ReturnType<typeof usePoolAccess>
  assetOriginator: ReturnType<typeof usePoolAccess>['assetOriginators'][0]
  poolId: string
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [account] = useSuitableAccounts({ poolId, actingAddress: [ao.address] }).filter((a) => a.proxies?.length === 2)
  const identity = useIdentity(ao.address)
  const api = useCentrifugeApi()
  const utils = useCentrifugeUtils()
  const routers = useDomainRouters()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const chainIds = routers?.map((r) => r.chainId) || []
  const getName = useGetNetworkName()

  const destinations = [
    'centrifuge',
    ...chainIds.map((cid) => ({ evm: cid })),
    ...Object.keys(parachainNames).map((pid) => ({ parachain: Number(pid) })),
  ]

  const { showPodAccountCreation } = useDebugFlags()
  const cent = useCentrifuge()
  const {
    proxy: { proxyDepositFactor },
    uniques: { collectionDeposit },
    loans: { loanDeposit },
    keystore: { keyDeposit },
    transferAllowlist: { receiverDeposit },
  } = useCentrifugeConsts()

  const initialValues: AOFormValues = React.useMemo(
    () => ({
      name: identity?.display,
      withdrawAddresses: [
        ...ao.transferAllowlist.map((l) => ({
          ...l,
          meta: { ...l.meta, address: l.meta?.address && utils.formatAddress(l.meta.address) },
        })),
        ...new Array(3).fill({}),
      ].slice(0, 3),
      delegates: ao.delegates.map((d) => d.delegatee),
      p2pKey: '',
      documentKey: '',
      podOperator: '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ao, identity]
  )

  const storedAORoles = {
    address: ao.address,
    roles: Object.fromEntries(ao.permissions.roles.map((role) => [role, true])),
  }

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update asset originator',
    (cent) =>
      (
        args: [
          addedWithdrawAddresses: WithdrawKey[],
          removedWithdrawAddresses: WithdrawKey[],
          newMetadata: PoolMetadata,
          addedPermissions?: ReturnType<typeof diffPermissions>['add'],
          addedAddresses?: string[],
          removedAddresses?: string[],
          keys?: {
            p2pKey: string
            documentKey: string
          },
          podOperator?: string,
          collectionId?: string
        ],
        options
      ) => {
        const [
          addedWithdrawAddresses,
          removedWithdrawAddresses,
          newMetadata,
          addedPermissions = [],
          addedAddresses = [],
          removedAddresses = [],
          keys,
          podOperator,
          collectionId,
        ] = args

        return combineLatest([
          cent.getApi(),
          cent.pools.updatePoolRoles([poolId, [...access.missingPermissions, ...addedPermissions], []], {
            batch: true,
          }),
          cent.pools.setMetadata([poolId, newMetadata], { batch: true }),
        ]).pipe(
          switchMap(([api, permissionTx, setMetadataTx]) => {
            const numProxyTypesPerHotWallet = 4
            const deposit = proxyDepositFactor
              .mul(new BN(Math.max(addedAddresses.length - removedAddresses.length, 0) * numProxyTypesPerHotWallet))
              .add(podOperator ? proxyDepositFactor : new BN(0))
              .add(collectionId ? collectionDeposit : new BN(0))
              .add(
                receiverDeposit.mul(
                  new BN(Math.max(addedWithdrawAddresses.length - removedWithdrawAddresses.length, 0))
                )
              )
              // When setting up the AO, also add enough funds to create 100 loans
              .add(keys ? keyDeposit.mul(new BN(2)).add(loanDeposit.mul(new BN(100))) : new BN(0))

            // doing the proxy and multisig transactions manually, because both the Pool Admin and the AO need to call extrinsics
            let tx = api.tx.proxy.proxy(
              account.proxies![0].delegator,
              undefined,
              api.tx.utility.batchAll([
                // Adding the permissions and metadata needs to be done by the Pool Admin, the rest by the AO
                ...permissionTx.method.args[0],
                setMetadataTx,
                api.tx.proxy.proxy(
                  account.proxies![1].delegator,
                  undefined,
                  api.tx.utility.batchAll(
                    [
                      removedAddresses.length &&
                        api.tx.utility.batch(
                          removedAddresses
                            .map((addr) => [
                              api.tx.proxy.removeProxy(addr, 'Borrow', 0),
                              api.tx.proxy.removeProxy(addr, 'Invest', 0),
                              api.tx.proxy.removeProxy(addr, 'PodAuth', 0),
                              api.tx.proxy.removeProxy(addr, 'Transfer', 0),
                            ])
                            .flat()
                        ),
                      addedAddresses.map((addr) => [
                        api.tx.proxy.addProxy(addr, 'Borrow', 0),
                        api.tx.proxy.addProxy(addr, 'Invest', 0),
                        api.tx.proxy.addProxy(addr, 'PodAuth', 0),
                        api.tx.proxy.addProxy(addr, 'Transfer', 0),
                      ]),
                      podOperator && api.tx.proxy.addProxy(podOperator, 'PodOperation', 0),
                      keys &&
                        api.tx.keystore.addKeys([
                          [keys.p2pKey, 'P2PDiscovery', 'ECDSA'],
                          [keys.documentKey, 'P2PDocumentSigning', 'ECDSA'],
                        ]),
                      collectionId && [api.tx.uniques.create(collectionId, ao.address)],
                      addedWithdrawAddresses.map((w) =>
                        api.tx.transferAllowList.addTransferAllowance(pool.currency.key, w)
                      ),
                      removedWithdrawAddresses.map((w) =>
                        api.tx.transferAllowList.removeTransferAllowance(pool.currency.key, w)
                      ),
                    ]
                      .filter(Boolean)
                      .flat(2)
                  )
                ),
              ])
            )

            if (options?.multisig) {
              const otherSigners = sortAddresses(
                options.multisig.signers.filter((signer) => !isSameAddress(signer, cent.getSignerAddress('substrate')))
              )
              console.log('multisig callData', tx.method.toHex())
              tx = api.tx.multisig.asMulti(options.multisig.threshold, otherSigners, null, tx, 0)
            }

            if (!deposit.isZero()) {
              tx = api.tx.utility.batchAll([
                !deposit.isZero() && api.tx.balances.transfer(account.proxies![1].delegator, deposit),
                tx,
              ])
            }

            return cent.wrapSignAndSend(api, tx, {
              ...options,
              proxies: [],
              multisig: undefined,
            })
          })
        )
      },
    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const form = useFormik<AOFormValues>({
    initialValues,
    onSubmit: async (values, actions) => {
      if (!metadata) return
      actions.setSubmitting(false)
      const addedDelegates = values.delegates.filter((addr) => !initialValues.delegates.includes(addr))
      const removedDelegates = initialValues.delegates.filter((addr) => !values.delegates.includes(addr))

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

      const newMetadata: PoolMetadata = {
        ...(metadata as any),
        pool: {
          ...(metadata.pool as any),
          assetOriginators: {
            ...metadata.pool?.assetOriginators,
            [ao.address]: {
              name: values.name,
              withdrawAddresses: values.withdrawAddresses
                .filter((w) => !!w.meta?.address)
                .map((w) => ({
                  location: w.meta!.location,
                  address:
                    typeof w.meta!.location !== 'string' && 'evm' in w.meta!.location
                      ? w.meta!.address.toLowerCase()
                      : addressToHex(w.meta!.address),
                })),
            },
          },
        },
      }
      execute(
        [
          addedWithdraw.map((w) => getKeyForReceiver(api, w.meta!)),
          removedWithdraw.map((w) => w.key!),
          newMetadata,
          addedPermissions,
          addedDelegates,
          removedDelegates,
          values.p2pKey && values.documentKey ? { p2pKey: values.p2pKey, documentKey: values.documentKey } : undefined,
          values.podOperator,
          !ao.collateralCollections.length ? await cent.nfts.getAvailableCollectionId() : undefined,
        ],
        { account }
      )
    },
    validate: (values) => {
      let errors: FormikErrors<AOFormValues> = {}
      values.withdrawAddresses.forEach((value, index) => {
        if (value.meta?.address) {
          if (!value.meta.location) {
            errors = setIn(errors, `withdrawAddresses.${index}.meta.location`, 'Required')
          } else {
            if (
              typeof value.meta.location !== 'string' &&
              'evm' in value.meta.location &&
              !isEvmAddress(value.meta.address)
            ) {
              errors = setIn(errors, `withdrawAddresses.${index}.meta.address`, 'Not a valid EVM address')
            } else if (!isSubstrateAddress(value.meta.address) || isEvmAddress(value.meta.address)) {
              errors = setIn(errors, `withdrawAddresses.${index}.meta.address`, 'Not a valid Substrate address')
            }
          }
        }
      })
      return errors
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const rows = React.useMemo(
    () => form.values.delegates.map((a, i) => ({ address: a, index: i })),
    [form.values.delegates]
  )

  const { add: addedWithdraw, remove: removedWithdraw } = diffWithdrawAddresses(
    initialValues.withdrawAddresses,
    form.values.withdrawAddresses
  )

  const hasChanges =
    (!!form.values.documentKey && !!form.values.p2pKey) ||
    form.values.name !== initialValues.name ||
    form.values.delegates.length !== initialValues.delegates.length ||
    !form.values.delegates.every((s) => initialValues.delegates.includes(s)) ||
    addedWithdraw.length ||
    removedWithdraw.length

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title={<Identity address={ao.address} clickToCopy />}
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={isLoading}
                  loadingMessage={isLoading ? 'Pending...' : undefined}
                  key="done"
                  disabled={!hasChanges || !account}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                {ao.isSetUp ? 'Edit' : 'Set up'}
              </Button>
            )
          }
        >
          <Stack gap={4}>
            {!ao.isSetUp && isEditing && (
              <Stack gap={2}>
                <Text as="h3" variant="heading4">
                  POD Setup
                </Text>
                {showPodAccountCreation && (
                  <CreatePodAccount
                    poolId={poolId}
                    address={ao.address}
                    onSuccess={(res) => {
                      form.setFieldValue('p2pKey', res.p2pDiscoveryKey, false)
                      form.setFieldValue('documentKey', res.documentSigningKey, false)
                      form.setFieldValue('podOperator', res.operatorAccountId, false)
                    }}
                  />
                )}
                <Text as="p" variant="body2" color="textSecondary">
                  Values that need to be set in order to be able to authenticate with the POD and create assets
                </Text>
                <FieldWithErrorMessage
                  validate={required()}
                  name="documentKey"
                  as={TextInput}
                  label="Document Signing Key"
                  placeholder="0x..."
                  maxLength={66}
                />
                <FieldWithErrorMessage
                  validate={required()}
                  name="p2pKey"
                  as={TextInput}
                  label="P2P Discovery Key"
                  placeholder="0x..."
                  maxLength={66}
                />
                <FieldWithErrorMessage
                  validate={required()}
                  name="podOperator"
                  as={TextInput}
                  label="Pod Operator Account ID"
                  placeholder="0x..."
                  maxLength={66}
                />
              </Stack>
            )}

            <Stack gap={2}>
              <Text as="h3" variant="heading4">
                Delegates
              </Text>
              <Text as="p" variant="body2" color="textSecondary">
                Add or remove addresses which can originate assets and invest in the junior tranche.
              </Text>
              <FieldArray name="delegates">
                {(fldArr) => (
                  <Stack gap={3}>
                    <DataTable
                      data={rows}
                      columns={[
                        {
                          align: 'left',
                          header: 'Address(es)',
                          cell: (row: Row) => (
                            <Text variant="body2">
                              <Identity address={row.address} clickToCopy showIcon labelForConnectedAddress={false} />
                            </Text>
                          ),
                        },
                        {
                          header: '',
                          cell: (row: Row) =>
                            isEditing && (
                              <Button
                                variant="tertiary"
                                icon={IconMinusCircle}
                                onClick={() => fldArr.remove(row.index)}
                                disabled={isLoading}
                              />
                            ),
                          width: '72px',
                        },
                      ]}
                    />
                    {isEditing && !isLoading && (
                      <AddAddressInput
                        existingAddresses={[...form.values.delegates, ao.address]}
                        onAdd={(address) => {
                          fldArr.push(addressToHex(address))
                        }}
                      />
                    )}
                  </Stack>
                )}
              </FieldArray>
            </Stack>

            <Stack gap={2}>
              <Text as="h3" variant="heading4">
                Trusted address
              </Text>
              <Text as="p" variant="body2" color="textSecondary">
                Paste the address to receive your funds after financing an asset. Be sure to select the right address
                and network. Receiving your funds on another address or network will result in loss of funds.
              </Text>
              <Stack gap="4px">
                {form.values.withdrawAddresses.map((value, index) => (
                  <Shelf key={index} alignItems="flex-start">
                    <FieldWithErrorMessage
                      name={`withdrawAddresses.${index}.meta.address`}
                      validate={address()}
                      label="Address"
                      disabled={!isEditing}
                      as={TextInput}
                      onChange={(event: any) => {
                        form.setFieldValue(`withdrawAddresses.${index}.key`, undefined, false)
                        form.setFieldValue(`withdrawAddresses.${index}.meta.address`, event.target.value)
                      }}
                      placeholder={value.key && !value.meta?.address ? '[Unknown address]' : ''}
                    />
                    <Box width={250}>
                      <Field name={`withdrawAddresses.${index}.meta.location`}>
                        {({ field, meta, form }: FieldProps) => (
                          <Select
                            name={`withdrawAddresses.${index}.meta.location`}
                            label="Destination"
                            onChange={(event) =>
                              form.setFieldValue(
                                `withdrawAddresses.${index}.meta.location`,
                                JSON.parse(event.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            errorMessage={(meta.touched || form.submitCount > 0) && meta.error ? meta.error : undefined}
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
                            disabled={!isEditing}
                          />
                        )}
                      </Field>
                    </Box>
                  </Shelf>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
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
        (value) =>
          (value.meta?.address &&
            value.meta.address === stored.meta?.address &&
            value.meta?.location === stored.meta?.location) ||
          value.key === stored.key
      )
    )
      remove.push(stored)
  })
  formValues.forEach((value) => {
    if (
      value.meta?.address &&
      !storedValues.find(
        (stored) => value.meta?.address === stored.meta?.address && value.meta?.location === stored.meta?.location
      )
    )
      add.push(value)
  })
  return {
    add,
    remove,
  }
}
