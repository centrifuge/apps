import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, NumberInput, Select, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'

const OPTIONS = [
  { label: 'Fund admin', value: 'fundAdmin' },
  { label: 'Trustee', value: 'trustee' },
  { label: 'Pricing oracle provider', value: 'pricingOracleProvider' },
  { label: 'Auditor', value: 'auditor' },
  { label: 'Custodian', value: 'custodian' },
  { label: 'Investment manager', value: 'Investment manager' },
  { label: 'Sub-advisor', value: 'subadvisor' },
  { label: 'Historical default rate', value: 'historicalDefaultRate' },
  { label: 'Other', value: 'other' },
]

const createCategory = () => ({
  type: 'fundAdmin',
  value: '',
})

export type IssuerDetail = {
  type: string
  value: string
  customType?: string
}

export function CustomCategories() {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  console.log('FORM', values)

  return (
    <FieldArray name="issuerCategories">
      {(fldArr) => (
        <Stack gap={2}>
          <Shelf justifyContent="space-between">
            <Box>
              <Text as="h3">Issuer profile categories</Text>
              <Text as="span" variant="body2" color="textSecondary">
                Add additional information
              </Text>
            </Box>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                fldArr.push(createCategory())
              }}
              small
            >
              {values.issuerCategories?.length ? 'Add another' : 'Add'}
            </Button>
          </Shelf>

          {!!values?.issuerCategories?.length &&
            values.issuerCategories.map(
              (category: { type: string; value: string | number; customType?: string }, index: number) => {
                return (
                  <Field name={`issuerCategories.${index}.type`} key={index}>
                    {({ field, meta }: FieldProps) => {
                      return (
                        <Shelf gap={2} alignItems="flex-start">
                          <Box flex="1">
                            <Select
                              name={`issuerCategories.${index}.type`}
                              onChange={(event) => {
                                const selectedValue = event.target.value
                                fmk.setFieldValue(`issuerCategories.${index}.type`, selectedValue)
                                if (selectedValue !== 'other') {
                                  fmk.setFieldValue(`issuerCategories.${index}.customType`, '')
                                }
                              }}
                              onBlur={field.onBlur}
                              errorMessage={meta.touched && meta.error ? meta.error : undefined}
                              value={field.value}
                              options={OPTIONS}
                              label="Type"
                            />
                          </Box>
                          {category.type === 'other' && (
                            <Box flex="1">
                              <Field
                                as={TextInput}
                                name={`issuerCategories.${index}.customType`}
                                value={category.customType}
                                label="Custom Type"
                                onBlur={field.onBlur}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                  fmk.setFieldValue(`issuerCategories.${index}.customType`, event.target.value)
                                }}
                              />
                            </Box>
                          )}
                          <Box flex="1">
                            <Field
                              as={category.type === 'historicalDefaultRate' ? NumberInput : TextInput}
                              symbol={category.type === 'historicalDefaultRate' ? '%' : undefined}
                              name={`issuerCategories.${index}.value`}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                fmk.setFieldValue(`issuerCategories.${index}.value`, event.target.value)
                              }}
                              onBlur={field.onBlur}
                              value={category.value}
                              label="Value"
                            />
                          </Box>
                          <Box alignSelf="end" marginLeft="auto">
                            <Button
                              type="button"
                              variant="secondary"
                              small
                              onClick={() => {
                                fldArr.remove(index)
                              }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Shelf>
                      )
                    }}
                  </Field>
                )
              }
            )}
        </Stack>
      )}
    </FieldArray>
  )
}
