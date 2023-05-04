import { addressToHex } from '@centrifuge/centrifuge-js'
import { Box, Button, IconMinusCircle, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { ErrorMessage, Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { DataTable } from '../../../components/DataTable'
import { Identity } from '../../../components/Identity'
import { min } from '../../../utils/validation'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import type { PoolManagersInput } from './PoolManagers'

type Row = { address: string; index: number }
type Props = { isEditing?: boolean; isLoading?: boolean; canRemoveFirst?: boolean }
export function MultisigForm({ isEditing = true, canRemoveFirst = true, isLoading }: Props) {
  const form = useFormikContext<PoolManagersInput>()
  const { adminMultisig } = form.values
  const rows = React.useMemo(
    () => adminMultisig.signers.map((a, i) => ({ address: a, index: i })),
    [adminMultisig.signers]
  )

  return (
    <FieldArray name="adminMultisig.signers">
      {(fldArr) => (
        <Stack gap={4}>
          <Stack gap={2}>
            <Text as="p" variant="body2" color="textSecondary">
              Add or remove addresses to manage the pool. Each manager can individually add investors and manage the
              reserve of the pool.
            </Text>
            <DataTable
              data={rows}
              columns={[
                {
                  align: 'left',
                  header: 'Address',
                  cell: (row: Row) => (
                    <Text variant="body2">
                      <Identity address={row.address} clickToCopy showIcon labelForConnectedAddress={false} />
                    </Text>
                  ),
                  flex: '3',
                },
                {
                  header: '',
                  cell: (row: Row, i) =>
                    isEditing && (
                      <Button
                        variant="tertiary"
                        icon={IconMinusCircle}
                        onClick={() => {
                          if (adminMultisig.threshold >= adminMultisig.signers.length) {
                            form.setFieldValue('adminMultisig.threshold', adminMultisig.signers.length - 1, false)
                          }
                          fldArr.remove(row.index)
                        }}
                        disabled={isLoading || (i === 0 && !canRemoveFirst)}
                      />
                    ),
                  flex: '0 0 72px',
                },
              ]}
            />
            {isEditing && !isLoading && (
              <AddAddressInput
                existingAddresses={adminMultisig.signers}
                onAdd={(address) => {
                  if (adminMultisig.signers.length === 1) {
                    form.setFieldValue('adminMultisig.threshold', 2, false)
                  }
                  fldArr.push(addressToHex(address))
                }}
              />
            )}
          </Stack>
          <Stack gap={2}>
            <Text as="h3" variant="heading3">
              Threshold
            </Text>
            <Text as="p" variant="body2" color="textSecondary">
              For additional security, changing the pool configuration (e.g. the tranche structure of write-off policy)
              requires multiple signers. Any such change will require the confirmation of:
            </Text>

            <Shelf gap={2}>
              {isEditing && (
                <Box maxWidth={150}>
                  <Field name="adminMultisig.threshold" validate={min(2, 'Multisig needs at least two signers')}>
                    {({ field, form }: FieldProps) => (
                      <Select
                        name="adminMultisig.threshold"
                        onChange={(event) => form.setFieldValue('adminMultisig.threshold', Number(event.target.value))}
                        onBlur={field.onBlur}
                        value={field.value}
                        options={adminMultisig.signers.map((_, i) => ({
                          value: `${i + 1}`,
                          label: `${i + 1}`,
                          disabled: i === 0,
                        }))}
                        placeholder=""
                      />
                    )}
                  </Field>
                </Box>
              )}
              <Text>
                {!isEditing && adminMultisig.threshold} out of {adminMultisig.signers.length} managers
              </Text>
            </Shelf>
            <Text variant="label2" color="statusCritical">
              <ErrorMessage name="adminMultisig.threshold" />
            </Text>
          </Stack>
        </Stack>
      )}
    </FieldArray>
  )
}
