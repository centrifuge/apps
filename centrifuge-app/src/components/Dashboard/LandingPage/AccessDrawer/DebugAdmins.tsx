import { PoolRoles, addressToHex, isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { AddressInput, Button, Checkbox, Grid, IconMinusCircle, Shelf, Stack, Text, truncate } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import { encodeAddress } from '@polkadot/util-crypto'
import { Field, FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { diffPermissions, usePoolPermissions, useSuitableAccounts } from '../../../../utils/usePermissions'
import { ButtonGroup } from '../../../ButtonGroup'
import { DataTable } from '../../../DataTable'
import { Identity } from '../../../Identity'
import { PageSection } from '../../../PageSection'
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
type PoolMetadataInput = {
  admins: Admin[]
}
type Row = Admin & { index: number }

export function DebugAdmins({ poolId }: { poolId: string }) {
  const poolPermissions = usePoolPermissions(poolId)
  const [isEditing, setIsEditing] = React.useState(false)

  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

  const initialValues: PoolMetadataInput = React.useMemo(
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

  const { execute, isLoading } = useCentrifugeTransaction('Update admins', (cent) => cent.pools.updatePoolRoles, {
    onSuccess: () => {
      setIsEditing(false)
    },
  })

  const form = useFormik({
    initialValues,
    onSubmit: (values, actions) => {
      actions.setSubmitting(false)
      if (!add.length && !remove.length) {
        setIsEditing(false)
        return
      }
      execute([poolId, add, remove], { account })
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const rows = React.useMemo(
    () => form.values.admins.map((a, i) => ({ ...a, index: i })).sort((a, b) => a.address.localeCompare(b.address)),
    [form.values.admins]
  )

  const { add, remove } = React.useMemo(
    () => diffPermissions(initialValues.admins, form.values.admins),
    [initialValues, form.values]
  )

  const poolAdminCount = rows.filter((r) => r.roles.PoolAdmin).length

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Admins"
          subtitle="At least one address is required"
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
                  disabled={!add.length && !remove.length}
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
                          disabled={!isEditing || isLoading || (poolAdminCount === 1 && row.roles.PoolAdmin)}
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
                          disabled={!isEditing || isLoading}
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
                          disabled={!isEditing || isLoading}
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
                          disabled={!isEditing || isLoading}
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
                          disabled={!isEditing || isLoading}
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
                          disabled={!isEditing || isLoading}
                        />
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
                            disabled={isLoading || (poolAdminCount === 1 && row.roles.PoolAdmin)}
                          />
                        ),
                      width: '72px',
                    },
                  ]}
                />
                {isEditing && (
                  <AddAddressInput
                    existingAddresses={form.values.admins.map((a) => a.address)}
                    onAdd={(address) => {
                      fldArr.push({ address, roles: {} })
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
    <Grid columns={2} equalColumns gap={4} alignItems="center">
      <AddressInput
        withClearIcon
        placeholder="Search to add address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      {address &&
        (truncated ? (
          <Shelf gap={2} alignItems="center">
            <Shelf style={{ pointerEvents: 'none' }} gap="4px">
              <Identicon value={address} size={16} theme="polkadot" />
              <Text variant="label2" color="textPrimary">
                {truncated}
              </Text>
            </Shelf>
            <Button
              variant="secondary"
              onClick={() => {
                onAdd(addressToHex(address))
                setAddress('')
              }}
              small
              disabled={exists}
            >
              Add address
            </Button>
            {exists && (
              <Text variant="label2" color="statusCritical">
                Already added
              </Text>
            )}
          </Shelf>
        ) : (
          <Text variant="label2" color="statusCritical">
            Invalid address
          </Text>
        ))}
    </Grid>
  )
}
