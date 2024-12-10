import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, FileUpload, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { AddButton } from './PoolDetailsSection'
import { StyledGrid } from './PoolStructureSection'

export const PoolRatingsSection = () => {
  const form = useFormikContext<PoolMetadataInput>()
  return (
    <Box mt={4} mb={3}>
      <Text variant="heading2">Pool rating</Text>
      <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} mt={3}>
        <FieldArray name="poolRatings">
          {({ push }) => (
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
                        label="Rating value"
                        placeholder="Type here..."
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
                    {({ field, form }: FieldProps) => (
                      <FileUpload
                        file={field.value}
                        onFileChange={(file) => {
                          form.setFieldTouched(`poolRatings.${index}.reportFile`, true, false)
                          form.setFieldValue(`poolRatings.${index}.reportFile`, file)
                        }}
                        accept="application/pdf"
                        label="Executive summary PDF"
                        placeholder="Choose file"
                        small
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
