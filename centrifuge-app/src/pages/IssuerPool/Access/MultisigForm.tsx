import { useCentEvmChainId } from '@centrifuge/centrifuge-react'
import {
  Box,
  Card,
  CardProps,
  Grid,
  IconButton,
  IconHelpCircle,
  IconInfo,
  IconTrash,
  Select,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { address, combine, required } from '../../../utils/validation'
import { FormAddressInput } from '../../IssuerCreatePool/FormAddressInput'
import { AddButton } from '../../IssuerCreatePool/PoolDetailsSection'
import { CheckboxOption } from '../../IssuerCreatePool/PoolStructureSection'
import type { PoolManagersInput } from './PoolManagers'

export function MultisigForm({ canEditFirst = true, cardProps }: { canEditFirst?: boolean; cardProps?: CardProps }) {
  const chainId = useCentEvmChainId()
  const form = useFormikContext<PoolManagersInput>()
  const { values } = form

  console.log('values.adminMultisig.signers', values.adminMultisig.signers)

  return (
    <Stack gap={2}>
      <FieldArray name="adminMultisig.signers">
        {({ push, remove }) => (
          <Card variant="secondary" p={2} {...cardProps}>
            <Grid minColumnWidth={250} maxColumns={2} gap={3} equalColumns>
              <Box>
                <Text variant="body2">Security requirement</Text>
                <CheckboxOption
                  height={40}
                  name="adminMultisigEnabled"
                  label="Single"
                  icon={<IconHelpCircle size="iconSmall" color="textSecondary" />}
                  onChange={() => {
                    form.setFieldValue('adminMultisigEnabled', false)
                    form.setFieldValue('adminMultisig.signers', [values.adminMultisig.signers[0]])
                  }}
                  isChecked={!values.adminMultisigEnabled}
                  id="singleMultisign"
                />
                <CheckboxOption
                  height={40}
                  name="adminMultisigEnabled"
                  label="Multi-sig"
                  icon={<IconHelpCircle size="iconSmall" color="textSecondary" />}
                  onChange={() => {
                    form.setFieldValue('adminMultisigEnabled', true)
                    push('')
                  }}
                  isChecked={values.adminMultisigEnabled}
                  id="multiMultisign"
                />
              </Box>
              <Stack gap={2}>
                <Text variant="body2">Wallet addresses</Text>
                <>
                  {values.adminMultisig?.signers
                    .slice(0, values.adminMultisigEnabled ? Infinity : 1)
                    ?.map((_, index) => (
                      <FormAddressInput
                        name={`adminMultisig.signers.${index}`}
                        validate={combine(address(), required())}
                        placeholder="Enter address..."
                        chainId={chainId}
                        symbol={
                          index >= 2 && (
                            <IconButton onClick={() => remove(index)}>
                              <IconTrash color="textSecondary" />
                            </IconButton>
                          )
                        }
                        readOnly={index === 0 && !canEditFirst}
                        key={index}
                      />
                    ))}
                  {values.adminMultisigEnabled && (
                    <Box alignSelf="flex-end">
                      <AddButton
                        onClick={() => {
                          if (values.adminMultisig && values.adminMultisig.signers?.length <= 10) {
                            push('')
                          }
                        }}
                      />
                    </Box>
                  )}
                </>
              </Stack>
            </Grid>
          </Card>
        )}
      </FieldArray>
      {values.adminMultisigEnabled && (
        <Card variant="secondary" p={2} {...cardProps}>
          <Grid minColumnWidth={250} maxColumns={2} gap={3} equalColumns>
            <Field name="adminMultisig.threshold">
              {({ field, meta, form }: FieldProps) => (
                <Select
                  name="adminMultisig.threshold"
                  label={`Configuration change threshold (${values?.adminMultisig?.threshold} out of ${Math.max(
                    values?.adminMultisig?.signers?.length ?? 0,
                    1
                  )} managers)`}
                  onChange={(event) => form.setFieldValue('adminMultisig.threshold', event.target.value)}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  value={field.value}
                  options={values.adminMultisig?.signers.map((_, i) => ({
                    label: i + 1,
                    value: String(i + 1),
                  }))}
                  placeholder="Select..."
                />
              )}
            </Field>
            <Shelf alignItems="flex-start" gap={1}>
              <IconInfo size="iconSmall" color="textSecondary" />
              <Text color="textSecondary" variant="body2">
                For added security, changes to the pool configuration (e.g., tranche structure or write-off policy) may
                require multiple signers and confirmation from the above.
              </Text>
            </Shelf>
          </Grid>
        </Card>
      )}
    </Stack>
  )

  // return (
  //   <FieldArray name="adminMultisig.signers">
  //     {(fldArr) => (
  //       <Stack gap={4}>
  //         <Stack gap={2}>
  //           <Text as="p" variant="body2" color="textSecondary">
  //             Add or remove addresses to manage the pool. Each manager can individually add investors and manage the
  //             reserve of the pool.
  //           </Text>
  //           <DataTable
  //             data={rows}
  //             columns={[
  //               {
  //                 align: 'left',
  //                 header: 'Address',
  //                 cell: (row: Row) => (
  //                   <Text variant="body2">
  //                     <Identity address={row.address} clickToCopy showIcon labelForConnectedAddress={false} />
  //                   </Text>
  //                 ),
  //               },
  //               {
  //                 header: '',
  //                 cell: (row: Row, i) =>
  //                   (
  //                     <Button
  //                       variant="tertiary"
  //                       icon={IconMinusCircle}
  //                       onClick={() => {
  //                         if (adminMultisig.threshold >= adminMultisig.signers.length) {
  //                           form.setFieldValue('adminMultisig.threshold', adminMultisig.signers.length - 1, false)
  //                         }
  //                         fldArr.remove(row.index)
  //                       }}
  //                       disabled={isLoading || (i === 0 && !canRemoveFirst)}
  //                     />
  //                   ),
  //                 width: '72px',
  //               },
  //             ]}
  //           />
  //           {(
  //             <AddAddressInput
  //               existingAddresses={adminMultisig.signers}
  //               onAdd={(address) => {
  //                 if (adminMultisig.signers.length < minThreshold) {
  //                   form.setFieldValue('adminMultisig.threshold', minThreshold, false)
  //                 }
  //                 fldArr.push(isEvmAddress(address) ? evmToSubstrateAddress(address, chainId ?? 0) : address)
  //               }}
  //             />
  //           )}
  //         </Stack>
  //         <Stack gap={2}>
  //           <ChangeThreshold
  //             secondaryText="For additional security, changing the pool configuration (e.g. the tranche structure or write-off policy)
  //       can require multiple signers. Any such change will require the confirmation of:"
  //             primaryText="Configuration change threshold"
  //             isEditing={isEditing}
  //             fieldName="adminMultisig.threshold"
  //             signersFieldName="adminMultisig.signers"
  //             type="managers"
  //           />
  //         </Stack>
  //       </Stack>
  //     )}
  //   </FieldArray>
  // )
}
