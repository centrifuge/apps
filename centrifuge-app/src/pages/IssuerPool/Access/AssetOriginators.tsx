import { addressToHex, computeTrancheId, isSameAddress, TransactionOptions } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeConsts, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, IconMinusCircle, Stack, Text, TextInput } from '@centrifuge/fabric'
import { sortAddresses } from '@polkadot/util-crypto'
import { BN } from 'bn.js'
import { FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { useDebugFlags } from '../../../components/DebugFlags'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Identity } from '../../../components/Identity'
import { PageSection } from '../../../components/PageSection'
import { useIdentity } from '../../../utils/useIdentity'
import { usePoolAccess, useSuitableAccounts } from '../../../utils/usePermissions'
import { required } from '../../../utils/validation'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import { diffPermissions } from '../Configuration/Admins'
import { CreatePodAccount } from './CreatePodAccount'

type AOFormValues = {
  withdrawAddress: string
  name: string
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

// TODO: Edit withdraw address for restricted transfers
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
  const { showPodAccountCreation } = useDebugFlags()
  const cent = useCentrifuge()
  const {
    proxy: { proxyDepositFactor },
    uniques: { collectionDeposit },
    loans: { loanDeposit },
    keystore: { keyDeposit },
  } = useCentrifugeConsts()

  const initialValues: AOFormValues = React.useMemo(
    () => ({
      name: identity?.display || '',
      withdrawAddress: '',
      delegates: ao.delegates.map((d) => d.delegatee),
      p2pKey: '',
      documentKey: '',
      podOperator: '',
    }),
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
          name?: string,
          withdrawAddress?: string,
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
        const [, , addedPermissions = [], addedAddresses = [], removedAddresses = [], keys, podOperator, collectionId] =
          args

        return combineLatest([
          cent.getApi(),
          cent.pools.updatePoolRoles([poolId, [...access.missingPermissions, ...addedPermissions], []], {
            batch: true,
          }),
        ]).pipe(
          switchMap(([api, permissionTx]) => {
            const numProxyTypesPerHotWallet = 3
            const deposit = proxyDepositFactor
              .mul(new BN(Math.max(addedAddresses.length - removedAddresses.length, 0) * numProxyTypesPerHotWallet))
              .add(podOperator ? proxyDepositFactor : new BN(0))
              .add(collectionId ? collectionDeposit : new BN(0))
              // When setting up the AO, also add enough funds to create 100 loans
              .add(keys ? keyDeposit.mul(new BN(2)).add(loanDeposit.mul(new BN(100))) : new BN(0))

            // doing the proxy and multisig transactions manually, because both the Pool Admin and the AO need to call extrinsics
            let tx = api.tx.proxy.proxy(
              account.proxies![0].delegator,
              undefined,
              api.tx.utility.batchAll([
                ...permissionTx.method.args[0], // Adding the permissions needs to be done by the Pool Admin, the rest by the AO
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
                            ])
                            .flat()
                        ),
                      addedAddresses.map((addr) => [
                        api.tx.proxy.addProxy(addr, 'Borrow', 0),
                        api.tx.proxy.addProxy(addr, 'Invest', 0),
                        api.tx.proxy.addProxy(addr, 'PodAuth', 0),
                        // TODO: Restricted Transfer
                      ]),
                      podOperator && api.tx.proxy.addProxy(podOperator, 'PodOperation', 0),
                      keys &&
                        api.tx.keystore.addKeys([
                          [keys.p2pKey, 'P2PDiscovery', 'ECDSA'],
                          [keys.documentKey, 'P2PDocumentSigning', 'ECDSA'],
                        ]),
                      collectionId && [api.tx.uniques.create(collectionId, ao.address)],
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

      execute(
        [
          ifChanged(values, initialValues, 'name'),
          ifChanged(values, initialValues, 'withdrawAddress'),
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

  const hasChanges =
    (!!form.values.documentKey && !!form.values.p2pKey) ||
    form.values.name !== initialValues.name ||
    form.values.delegates.length !== initialValues.delegates.length ||
    !form.values.delegates.every((s) => initialValues.delegates.includes(s))

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
                          flex: '3',
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
                          flex: '0 0 72px',
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
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}

function ifChanged<Key extends keyof AOFormValues>(
  values: AOFormValues,
  initialValues: AOFormValues,
  key: Key
): AOFormValues[Key] | undefined {
  return values[key] !== initialValues[key] ? values[key] : undefined
}
