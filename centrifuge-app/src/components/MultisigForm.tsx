import { useCentEvmChainId } from '@centrifuge/centrifuge-react'
import {
  Box,
  Card,
  CardProps,
  Divider,
  Grid,
  IconButton,
  IconHelpCircle,
  IconInfo,
  IconTrash,
  RadioButton,
  Select,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { useTheme } from 'styled-components'
import { FormAddressInput } from '../pages/IssuerCreatePool/FormAddressInput'
import { AddButton } from '../pages/IssuerCreatePool/PoolDetailsSection'
import type { PoolManagersInput } from '../pages/IssuerPool/Access/PoolManagers'
import { address, combine, required } from '../utils/validation'
import { Tooltips } from './Tooltips'

export function MultisigForm({ canEditFirst = true, cardProps }: { canEditFirst?: boolean; cardProps?: CardProps }) {
  const theme = useTheme()
  const chainId = useCentEvmChainId()
  const form = useFormikContext<PoolManagersInput>()
  const { values } = form

  return (
    <Stack gap={2} mb={2}>
      <FieldArray name="adminMultisig.signers">
        {({ push, remove }) => (
          <Card variant="secondary" p={2} {...cardProps}>
            <Grid minColumnWidth={250} maxColumns={2} gap={3} equalColumns>
              <Box>
                <Stack gap={2}>
                  <Text variant="body2">Security requirement</Text>
                  <RadioButton
                    height={40}
                    name="adminMultisigEnabled"
                    label="Single"
                    icon={
                      <Tooltips
                        type="singleMultisign"
                        label={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
                        placement="left"
                      />
                    }
                    onChange={() => {
                      form.setFieldValue('adminMultisigEnabled', false)
                      form.setFieldValue('adminMultisig.signers', [values.adminMultisig.signers[0]])
                    }}
                    checked={!values.adminMultisigEnabled}
                    border
                    styles={{ padding: '0px 8px' }}
                  />
                  <RadioButton
                    height={40}
                    name="adminMultisigEnabled"
                    label="Multi-sig"
                    icon={
                      <Tooltips
                        type="multiMultisign"
                        label={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
                        placement="left"
                      />
                    }
                    onChange={() => {
                      form.setFieldValue('adminMultisigEnabled', true)
                      push('')
                    }}
                    checked={values.adminMultisigEnabled}
                    border
                    styles={{ padding: '0px 8px' }}
                  />
                </Stack>
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
                        variant={canEditFirst ? 'inverted' : 'secondary'}
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
            <Shelf alignItems="flex-start" gap={1}>
              <IconInfo size="iconSmall" />
              <Text variant="body2" lineHeight={1.4}>
                For added security, changes to the pool configuration (e.g., tranche structure or write-off policy) may
                require multiple signers and confirmation from the above.
              </Text>
            </Shelf>
            <Divider color="textSecondary" />
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
          </Grid>
        </Card>
      )}
    </Stack>
  )
}
