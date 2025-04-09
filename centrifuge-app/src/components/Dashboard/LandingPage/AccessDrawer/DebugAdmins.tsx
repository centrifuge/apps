import Centrifuge, { PoolMetadata, PoolRoles, addressToHex, isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { AddressInput, Box, Button, Checkbox, IconMinusCircle, Shelf, Stack, Text, truncate } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/util-crypto'
import { Field, FieldArray, Form, FormikProvider, useFormikContext } from 'formik'
import * as React from 'react'
import { firstValueFrom } from 'rxjs'
import type { FormHandle } from '.'
import { diffPermissions, usePoolPermissions } from '../../../../utils/usePermissions'
import { DataTable } from '../../../DataTable'
import { Identity } from '../../../Identity'
import { Tooltips } from '../../../Tooltips'

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
export type DebugAdminsFormValues = {
  admins: Admin[]
}
type Row = Admin & { index: number }

export function DebugAdmins({ poolId, handle }: { poolId: string; handle: React.RefObject<FormHandle> }) {
  const poolPermissions = usePoolPermissions(poolId)
  const form = useFormikContext<DebugAdminsFormValues>()

  const initialValues: DebugAdminsFormValues = React.useMemo(
    () => ({
      admins: poolPermissions
        ? Object.entries<PoolRoles>(poolPermissions)
            .filter(([, p]) => p.roles.length)
            .map(([userAddress, permissions]) => ({
              address: encodeAddress(userAddress),
              roles: Object.fromEntries(permissions.roles.map((role) => [role, true])) as Admin['roles'],
            }))
        : [],
    }),
    [poolPermissions]
  )

  React.useEffect(() => {
    form.setFieldValue('admins', initialValues.admins, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  function checkHasChanges(values: DebugAdminsFormValues) {
    const { add, remove } = diffPermissions(initialValues.admins, values.admins)
    return !!add.length || !!remove.length
  }

  async function getBatch(cent: Centrifuge, values: DebugAdminsFormValues, metadata: PoolMetadata) {
    const { add, remove } = diffPermissions(initialValues.admins, values.admins)

    if (!checkHasChanges(values)) {
      return { batch: [], metadata }
    }
    return {
      batch: [await firstValueFrom(cent.pools.updatePoolRoles([poolId, add, remove], { batch: true }))],
      metadata,
    }
  }

  React.useImperativeHandle(handle, () => ({
    getBatch,
    hasChanges: checkHasChanges,
  }))

  const rows = React.useMemo(
    () => form.values.admins.map((a, i) => ({ ...a, index: i })).sort((a, b) => a.address.localeCompare(b.address)),
    [form.values.admins]
  )

  const poolAdminCount = rows.filter((r) => r.roles.PoolAdmin).length

  return (
    <FormikProvider value={form}>
      <Form>
        <Stack gap={2}>
          <FieldArray name="admins">
            {(fldArr) => (
              <Stack gap={3}>
                <DataTable
                  scrollable
                  data={rows}
                  columns={[
                    {
                      align: 'left',
                      header: 'Address',
                      cell: (row: Admin) => (
                        <Text variant="body2">
                          <Identity address={row.address} clickToCopy labelForConnectedAddress={false} />
                        </Text>
                      ),
                      width: 'max-content',
                    },
                    {
                      align: 'center',
                      header: <Tooltips type="pool" />,
                      cell: (row: Row) => (
                        <Field
                          name={`admins.${row.index}.roles.PoolAdmin`}
                          as={Checkbox}
                          type="checkbox"
                          disabled={poolAdminCount === 1 && row.roles.PoolAdmin}
                        />
                      ),
                    },
                    {
                      align: 'center',
                      header: <Tooltips type="borrower" />,
                      cell: (row: Row) => (
                        <Field name={`admins.${row.index}.roles.Borrower`} as={Checkbox} type="checkbox" />
                      ),
                    },
                    {
                      align: 'center',
                      header: <Tooltips type="whitelist" />,
                      cell: (row: Row) => (
                        <Field name={`admins.${row.index}.roles.InvestorAdmin`} as={Checkbox} type="checkbox" />
                      ),
                    },
                    {
                      align: 'center',
                      header: <Tooltips type="asset" />,
                      cell: (row: Row) => (
                        <Field name={`admins.${row.index}.roles.LoanAdmin`} as={Checkbox} type="checkbox" />
                      ),
                    },
                    {
                      align: 'center',
                      header: <Tooltips type="liquidity" />,
                      cell: (row: Row) => (
                        <Field name={`admins.${row.index}.roles.LiquidityAdmin`} as={Checkbox} type="checkbox" />
                      ),
                    },
                    {
                      header: '',
                      cell: (row: Row) => (
                        <Button
                          variant="tertiary"
                          small
                          icon={IconMinusCircle}
                          onClick={() => fldArr.remove(row.index)}
                          disabled={poolAdminCount === 1 && row.roles.PoolAdmin}
                        />
                      ),
                      width: '72px',
                    },
                  ]}
                />

                <AddAddressInput
                  existingAddresses={form.values.admins.map((a) => a.address)}
                  onAdd={(address) => {
                    fldArr.push({ address, roles: {} })
                  }}
                />
              </Stack>
            )}
          </FieldArray>
        </Stack>
      </Form>
    </FormikProvider>
  )
}

export function AddAddressInput({
  onAdd,
  existingAddresses,
}: {
  onAdd: (address: string) => void
  existingAddresses: string[]
}) {
  const [address, setAddress] = React.useState('')

  const utils = useCentrifugeUtils()
  let truncated: string | undefined
  try {
    truncated = truncate(utils.formatAddress(address))
  } catch (e) {
    truncated = undefined
  }

  const exists = !!truncated && existingAddresses.some((addr) => isSameAddress(addr, address))

  return (
    <Shelf gap={2}>
      <Box flex={3}>
        <AddressInput
          withClearIcon
          placeholder="Type here..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </Box>
      {address &&
        (truncated ? (
          <Box flex={1}>
            <Stack gap={1} alignItems="center">
              <Button
                variant="secondary"
                onClick={() => {
                  onAdd(addressToHex(address))
                  setAddress('')
                }}
                small
                disabled={exists}
              >
                Add
              </Button>
            </Stack>
          </Box>
        ) : (
          <Text variant="label2" color="statusCritical">
            Invalid address
          </Text>
        ))}
    </Shelf>
  )
}
