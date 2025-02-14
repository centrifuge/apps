import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, FileUpload, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { LabelWithDeleteButton } from './IssuerCategories'
import { AddButton } from './PoolDetailsSection'
import { StyledGrid } from './PoolStructureSection'

export const PoolRatingsSection = ({ hideTitle }: { hideTitle?: boolean }) => {
  const form = useFormikContext<PoolMetadataInput>()

  return (
    <Box mt={hideTitle ? 0 : 4} mb={hideTitle ? 0 : 3}>
      {hideTitle ? <></> : <Text variant="heading2">Pool rating</Text>}
      <StyledGrid
        gridTemplateColumns={hideTitle ? ['1fr'] : ['1fr', '1fr 1fr']}
        mt={hideTitle ? 0 : 3}
        style={hideTitle ? { padding: 20 } : { padding: 40 }}
      >
        <FieldArray name="poolRatings">
          {({ push, remove }) => (
            <>
              {form.values.poolRatings.map((_, index) => (
                <>
                  <Field name={`poolRatings.${index}.agency`}>
                    {({ field, meta }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        as={TextInput}
                        label="Rating agency"
                        placeholder="Type here..."
                      />
                    )}
                  </Field>

                  <Field name={`poolRatings.${index}.value`}>
                    {({ field, meta }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        as={TextInput}
                        placeholder="Type here..."
                        label={
                          <LabelWithDeleteButton
                            onDelete={() => remove(index)}
                            hideButton={form.values.poolRatings.length === 1}
                            label="Rating value"
                          />
                        }
                      />
                    )}
                  </Field>

                  <Field name={`poolRatings.${index}.reportUrl`}>
                    {({ field }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        label="Rating report URL"
                        placeholder="Type here..."
                        as={URLInput}
                      />
                    )}
                  </Field>

                  <Field name={`poolRatings.${index}.reportFile`}>
                    {({ field, form, meta }: FieldProps) => (
                      <FileUpload
                        file={field.value}
                        onFileChange={(file) => {
                          form.setFieldTouched(`poolRatings.${index}.reportFile`, true, false)
                          form.setFieldValue(`poolRatings.${index}.reportFile`, file)
                        }}
                        accept="application/pdf"
                        label="Rating report PDF"
                        placeholder="Choose file"
                        small
                        errorMessage={meta.touched && meta.error ? meta.error : undefined}
                        onClear={() => form.setFieldValue(`poolRatings.${index}.reportFile`, null)}
                      />
                    )}
                  </Field>
                </>
              ))}

              <Box gridColumn="span 2">
                <AddButton onClick={() => push({ agency: '', value: '', reportUrl: '' })} />
              </Box>
            </>
          )}
        </FieldArray>
      </StyledGrid>
    </Box>
  )
}
