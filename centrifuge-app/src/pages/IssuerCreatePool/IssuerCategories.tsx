import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, Grid, IconButton, IconTrash, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { AddButton } from './PoolDetailsSection'
import { StyledGrid } from './PoolStructureSection'

const PROVIDERS = [
  { label: 'Please select...', value: '' },
  { label: 'Fund admin', value: 'fundAdmin' },
  { label: 'Trustee', value: 'trustee' },
  { label: 'Pricing oracle provider', value: 'pricingOracleProvider' },
  { label: 'Auditor', value: 'auditor' },
  { label: 'Custodian', value: 'custodian' },
  { label: 'Investment manager', value: 'investmentManager' },
  { label: 'Sub-advisor', value: 'subadvisor' },
  { label: 'Historical default rate', value: 'historicalDefaultRate' },
  { label: 'Other', value: 'other' },
]

export const LabelWithDeleteButton = ({
  onDelete,
  hideButton,
  label,
}: {
  onDelete: () => void
  hideButton: boolean
  label: string
}) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Text variant="heading4">{label}</Text>
      {!hideButton && (
        <IconButton onClick={onDelete}>
          <IconTrash color="textSecondary" />
        </IconButton>
      )}
    </Box>
  )
}

export const IssuerCategoriesSection = () => {
  const form = useFormikContext<PoolMetadataInput>()
  return (
    <Box mt={4} mb={3}>
      <Text variant="heading2">Service providers</Text>
      <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} mt={3}>
        <FieldArray name="issuerCategories">
          {({ push, remove }) => (
            <>
              {form.values.issuerCategories.map((category, index) => (
                <>
                  <Grid gridTemplateColumns={['1fr', category.type === 'other' ? '1fr 1fr' : '1fr']} gap={2}>
                    <Field name={`issuerCategories.${index}.type`}>
                      {({ field, meta }: FieldProps) => (
                        <Select
                          name={field.name}
                          label="Type"
                          onChange={(event) => form.setFieldValue(field.name, event.target.value)}
                          onBlur={field.onBlur}
                          value={field.value}
                          options={PROVIDERS}
                          errorMessage={meta.touched && meta.error ? meta.error : undefined}
                        />
                      )}
                    </Field>
                    {category.type === 'other' && (
                      <Field name={`issuerCategories.${index}.description`}>
                        {({ field, meta }: FieldProps) => (
                          <FieldWithErrorMessage
                            {...field}
                            label="Description"
                            placeholder="Type here..."
                            maxLength={100}
                            as={TextInput}
                            onBlur={field.onBlur}
                          />
                        )}
                      </Field>
                    )}
                  </Grid>
                  <Field name={`issuerCategories.${index}.value`}>
                    {({ field, meta }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        label={
                          <LabelWithDeleteButton
                            onDelete={() => remove(index)}
                            hideButton={form.values.issuerCategories.length === 1}
                            label="Name of provider"
                          />
                        }
                        placeholder="Type here..."
                        maxLength={100}
                        errorMessage={meta.touched && meta.error ? meta.error : undefined}
                        onBlur={field.onBlur}
                        as={TextInput}
                      />
                    )}
                  </Field>
                </>
              ))}
              <Box gridColumn="span 2">
                <AddButton onClick={() => push({ type: '', value: '' })} />
              </Box>
            </>
          )}
        </FieldArray>
      </StyledGrid>
    </Box>
  )
}
