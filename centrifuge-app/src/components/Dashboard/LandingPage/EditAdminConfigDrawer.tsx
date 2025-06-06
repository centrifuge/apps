import { addressToHex, PoolRoles } from '@centrifuge/centrifuge-js'
import { isSameAddress, useCentrifugeTransaction, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import {
  AddressInput,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Select,
  Shelf,
  Stack,
  Text,
  truncate,
} from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/util-crypto'
import { Field, FieldArray, Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { usePoolPermissions, useSuitableAccounts } from '../../../utils/usePermissions'
import { DataTable } from '../../DataTable'
import { Identity } from '../../Identity'
import { Tooltips } from '../../Tooltips'
import { PoolWithMetadata } from '../utils'

const roles = ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'InvestorAdmin', 'LoanAdmin', 'PODReadAccess']

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
type PoolMetadataInput = {
  admins: Admin[]
}
type Row = Admin & { index: number }

export function EditAdminConfigDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { poolsWithMetadata } = useSelectedPools()
  const [poolId, setPoolId] = useState<string>(poolsWithMetadata[0].id)
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

  const poolPermissions = usePoolPermissions(poolId)

  const initialValues: PoolMetadataInput = useMemo(
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

  const { execute, isLoading } = useCentrifugeTransaction('Update admins', (cent) => cent.pools.updatePoolRoles)

  const form = useFormik({
    enableReinitialize: true,
    initialValues,
    onSubmit: (values, actions) => {
      const { add, remove } = permissions
      actions.setSubmitting(false)
      if (!add?.length && !remove?.length) {
        return
      }
      execute([poolId, permissions?.add, permissions?.remove], { account })
    },
  })

  useEffect(() => {
    if (open && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const rows = useMemo(
    () => form.values.admins.map((a, i) => ({ ...a, index: i })).sort((a, b) => a.address.localeCompare(b.address)),
    [form.values.admins, poolId]
  )

  const permissions = useMemo(
    () => diffPermissions(initialValues.admins, form.values.admins),
    [initialValues, form.values, poolId]
  )

  const poolAdminCount = rows.filter((r) => r.roles.PoolAdmin).length

  return (
    <Drawer title="Edit admin config" isOpen={open} onClose={onClose}>
      <Divider color="backgroundSecondary" />
      <Select
        label="Select pool"
        options={poolsWithMetadata.map((pool) => ({
          label: pool.meta?.pool?.name,
          value: pool.id,
        }))}
        value={poolId}
        onChange={(event) => {
          const selectedPool = poolsWithMetadata.find((pool: PoolWithMetadata) => pool.id === event.target.value)
          if (selectedPool) {
            setPoolId(selectedPool.id)
          }
        }}
      />
      <Stack>
        <FormikProvider value={form}>
          <Form>
            <Box display="flex" flexDirection="column" height="85vh">
              <Stack mb={3} overflow="auto">
                <FieldArray name="admins">
                  {(fldArr) => (
                    <Stack gap={3}>
                      <DataTable
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
                                disabled={isLoading || (poolAdminCount === 1 && row.roles.PoolAdmin)}
                              />
                            ),
                          },
                          {
                            align: 'center',
                            header: <Tooltips type="borrower" />,
                            cell: (row: Row) => (
                              <Field
                                name={`admins.${row.index}.roles.Borrower`}
                                as={Checkbox}
                                type="checkbox"
                                disabled={isLoading}
                              />
                            ),
                          },
                          {
                            align: 'center',
                            header: <Tooltips type="whitelist" />,
                            cell: (row: Row) => (
                              <Field
                                name={`admins.${row.index}.roles.InvestorAdmin`}
                                as={Checkbox}
                                type="checkbox"
                                disabled={isLoading}
                              />
                            ),
                          },
                          {
                            align: 'center',
                            header: <Tooltips type="asset" />,
                            cell: (row: Row) => (
                              <Field
                                name={`admins.${row.index}.roles.LoanAdmin`}
                                as={Checkbox}
                                type="checkbox"
                                disabled={isLoading}
                              />
                            ),
                          },
                          {
                            align: 'center',
                            header: <Tooltips type="liquidity" />,
                            cell: (row: Row) => (
                              <Field
                                name={`admins.${row.index}.roles.LiquidityAdmin`}
                                as={Checkbox}
                                type="checkbox"
                                disabled={isLoading}
                              />
                            ),
                          },
                          {
                            align: 'center',
                            header: 'Investor access',
                            cell: (row: Row) => (
                              <Field
                                name={`admins.${row.index}.roles.PODReadAccess`}
                                as={Checkbox}
                                type="checkbox"
                                disabled={isLoading}
                              />
                            ),
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
              <Stack gap={2} display="flex" justifyContent="flex-end" flexDirection="column">
                <Button loading={isLoading} type="submit" disabled={!form.dirty || !form.isValid}>
                  Update
                </Button>
                <Button variant="inverted" onClick={onClose}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          </Form>
        </FormikProvider>
      </Stack>
    </Drawer>
  )
}

export function diffPermissions(
  storedValues: Admin[],
  formValues: Admin[],
  rolesToCheck = roles
): { add: [string, AdminRole][]; remove: [string, AdminRole][] } {
  const storedObj = Object.fromEntries(storedValues.map((admin) => [admin.address, admin.roles]))
  const formObj = Object.fromEntries(formValues.map((admin) => [admin.address, admin.roles]))
  const addresses = Array.from(new Set([...storedValues, ...formValues].map((a) => a.address)))

  const add: [string, AdminRole][] = []
  const remove: [string, AdminRole][] = []

  addresses.forEach((addr) => {
    rolesToCheck.forEach((role) => {
      const had = !!storedObj[addr]?.[role as AdminRole]
      const has = !!formObj[addr]?.[role as AdminRole]
      if (had !== has) {
        if (has) {
          add.push([addr, role as AdminRole])
        } else {
          remove.push([addr, role as AdminRole])
        }
      }
    })
  })

  return { add, remove }
}

export function AddAddressInput({
  onAdd,
  existingAddresses,
}: {
  onAdd: (address: string) => void
  existingAddresses: string[]
}) {
  const [address, setAddress] = useState('')

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
        <AddressInput placeholder="Type here..." value={address} onChange={(e) => setAddress(e.target.value)} />
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
