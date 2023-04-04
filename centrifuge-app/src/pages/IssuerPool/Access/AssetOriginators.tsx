import { addressToHex, PoolMetadata } from '@centrifuge/centrifuge-js'
import { ComputedMultisig, computeMultisig, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, IconMinusCircle, NumberInput, Stack, Text } from '@centrifuge/fabric'
import { FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Identity } from '../../../components/Identity'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { PageSection } from '../../../components/PageSection'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { usePoolAccess, usePoolPermissions } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { combine, integer, max, positiveNumber } from '../../../utils/validation'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import { diffPermissions } from '../Configuration/Admins'

export function AssetOriginators({ poolId }: { poolId: string }) {
  const data = usePoolAccess(poolId)
  const pool = usePool(poolId)
  const [isEditing, setIsEditing] = React.useState(false)
  const poolPermissions = usePoolPermissions(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const prefetchMetadata = usePrefetchMetadata()

  const initialValues: PoolManagersInput = React.useMemo(
    () => ({
      signers: data.multisig?.signers || [],
      threshold: data.multisig?.threshold || 1,
    }),
    [data?.multisig]
  )

  const storedManagerPermissions = poolPermissions
    ? Object.entries(poolPermissions)
        .filter(([addr, p]) => p.roles.length && initialValues.signers.includes(addr))
        .map(([address, permissions]) => ({
          address,
          roles: Object.fromEntries(permissions.roles.map((role) => [role, true])),
        }))
    : []

  const { execute, isLoading } = useCentrifugeTransaction(
    'Update pool managers',
    (cent) =>
      (
        args: [
          newMultisig: ComputedMultisig,
          permissionChanges: ReturnType<typeof diffPermissions>,
          newMetadata: PoolMetadata
        ],
        options
      ) => {
        const [newMultisig, permissionChanges, newMetadata] = args

        return combineLatest([
          cent.getApi(),
          cent.pools.setMetadata([poolId, newMetadata as any], { batch: true }),
          cent.pools.updatePoolRoles([poolId, permissionChanges.add, permissionChanges.remove], { batch: true }),
        ]).pipe(
          switchMap(([api, metadataTx, permissionTx]) => {
            console.log('newMetadata', newMetadata)
            console.log('permissionChanges', permissionChanges, permissionTx)
            const tx = api.tx.utility.batchAll([
              metadataTx,
              ...permissionTx.method.args[0],
              api.tx.proxy.addProxy(newMultisig.address, 'Any', 0),
              api.tx.proxy.removeProxy(data.multisig!.address, 'Any', 0),
            ])
            return cent.wrapSignAndSend(api, tx, options)
          })
        )
      },
    {
      onSuccess: () => {
        setIsEditing(false)
      },
    }
  )

  const form = useFormik({
    initialValues,
    onSubmit: (values, actions) => {
      if (!metadata || !poolPermissions) return
      actions.setSubmitting(false)
      const newMultisig = computeMultisig(values)

      const newPoolMetadata: PoolMetadata = {
        ...(metadata as PoolMetadata),
        adminMultisig: {
          signers: newMultisig.signers,
          threshold: newMultisig.threshold,
        },
      }

      execute([
        newMultisig,
        diffPermissions(
          storedManagerPermissions,
          values.signers.map((address) => ({ address, roles: { MemberListAdmin: true, LiquidityAdmin: true } })),
          ['LiquidityAdmin', 'MemberListAdmin']
        ),
        newPoolMetadata,
      ])
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const rows = React.useMemo(() => form.values.signers.map((a, i) => ({ address: a, index: i })), [form.values.signers])

  console.log('rows', rows, form.values.signers)

  const hasChanges =
    form.values.threshold !== initialValues.threshold ||
    form.values.signers.length !== initialValues.signers.length ||
    !form.values.signers.every((s) => initialValues.signers.includes(s))

  console.log('hasChanges', hasChanges)

  if (!data.multisig) return null

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Pool managers"
          subtitle="Add/remove addresses as pool managers, which can add investors and manage the reserve."
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
                  disabled={!hasChanges}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                Edit
              </Button>
            )
          }
        >
          <FieldArray name="signers">
            {(fldArr) => (
              <Stack gap={3}>
                <DataTable
                  data={rows}
                  columns={[
                    {
                      align: 'left',
                      header: 'Address',
                      cell: (row: Row) => (
                        <Text variant="body2">
                          <Identity address={row.address} clickToCopy labelForConnectedAddress={false} />
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
                {isEditing ? (
                  <Box maxWidth={150}>
                    <FieldWithErrorMessage
                      as={NumberInput}
                      label="Threshold"
                      type="number"
                      min="1"
                      max={form.values.signers.length}
                      validate={combine(integer(), positiveNumber(), max(form.values.signers.length))}
                      name="threshold"
                    />
                  </Box>
                ) : (
                  <LabelValueStack label="Threshold" value={initialValues.threshold} />
                )}
                {isEditing && !isLoading && (
                  <AddAddressInput
                    existingAddresses={form.values.signers}
                    onAdd={(address) => {
                      fldArr.push(addressToHex(address))
                    }}
                  />
                )}
              </Stack>
            )}
          </FieldArray>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
