import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useCentEvmChainId } from '@centrifuge/centrifuge-react'
import { Button, IconMinusCircle, Stack, Text } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import * as React from 'react'
import { DataTable } from '../../../components/DataTable'
import { Identity } from '../../../components/Identity'
import { isEvmAddress } from '../../../utils/address'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import { ChangeThreshold } from './ChangeTreshold'
import type { PoolManagersInput } from './PoolManagers'

type Row = { address: string; index: number }
type Props = { isEditing?: boolean; isLoading?: boolean; canRemoveFirst?: boolean; minThreshold?: number }
export function MultisigForm({ isEditing = true, canRemoveFirst = true, isLoading, minThreshold = 1 }: Props) {
  const chainId = useCentEvmChainId()
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
                  width: '72px',
                },
              ]}
            />
            {isEditing && !isLoading && (
              <AddAddressInput
                existingAddresses={adminMultisig.signers}
                onAdd={(address) => {
                  if (adminMultisig.signers.length < minThreshold) {
                    form.setFieldValue('adminMultisig.threshold', minThreshold, false)
                  }
                  fldArr.push(isEvmAddress(address) ? evmToSubstrateAddress(address, chainId ?? 0) : address)
                }}
              />
            )}
          </Stack>
          <Stack gap={2}>
            <ChangeThreshold
              secondaryText="For additional security, changing the pool configuration (e.g. the tranche structure or write-off policy)
        can require multiple signers. Any such change will require the confirmation of:"
              primaryText="Configuration change threshold"
              isEditing={isEditing}
              fieldName="adminMultisig.threshold"
              signersFieldName="adminMultisig.signers"
              type="managers"
            />
          </Stack>
        </Stack>
      )}
    </FieldArray>
  )
}
