import { Box, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { LabelWithDeleteButton } from './IssuerCategories'
import { AddButton } from './PoolDetailsSection'
import { ReportFileUpload } from './PoolRatings'
import { StyledGrid } from './PoolStructureSection'
import { validate } from './validate'

export function PoolAnalysisSection({ isUpdating }: { isUpdating?: boolean }) {
  const form = useFormikContext<any>()
  const formName = isUpdating ? 'pool.reports' : 'reports'
  const reports = isUpdating ? form.values.pool.reports : form.values.reports

  return (
    <Box mt={isUpdating ? 0 : 4} mb={isUpdating ? 0 : 3}>
      {!isUpdating && <Text variant="heading2">Pool analysis</Text>}
      <StyledGrid
        gridTemplateColumns={isUpdating ? ['1fr'] : ['1fr', '1fr 1fr']}
        gap={3}
        mt={isUpdating ? 0 : 3}
        style={{ padding: isUpdating ? 20 : 40 }}
      >
        <FieldArray name={formName}>
          {({ push, remove }) => (
            <>
              {reports?.map((_: any, index: number) => (
                <>
                  <Field name={`${formName}.${index}.url`}>
                    {({ field }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        label="Report URL"
                        placeholder="Type here..."
                        validate={validate.websiteNotRequired()}
                        as={URLInput}
                      />
                    )}
                  </Field>
                  <Field name={`${formName}.${index}.author.name`}>
                    {({ field, meta }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        as={TextInput}
                        label={
                          <LabelWithDeleteButton
                            onDelete={() => remove(index)}
                            hideButton={reports?.length === 1}
                            label="Reviewer name"
                          />
                        }
                        placeholder="Type here..."
                      />
                    )}
                  </Field>
                  <Field name={`${formName}.${index}.author.title`}>
                    {({ field }: FieldProps) => (
                      <FieldWithErrorMessage
                        {...field}
                        as={TextInput}
                        label="Rewiewer job title"
                        placeholder="Type here..."
                      />
                    )}
                  </Field>
                  <Field name={`${formName}.${index}.file`}>
                    {() => (
                      <ReportFileUpload
                        name={`${formName}.${index}.file`}
                        accept="application/pdf"
                        label="Report PDF"
                        placeholder="Choose file"
                        small
                      />
                    )}
                  </Field>
                </>
              ))}

              <Box gridColumn="span 2">
                <AddButton onClick={() => push({ url: '', author: { name: '', title: '' }, file: null })} />
              </Box>
            </>
          )}
        </FieldArray>
      </StyledGrid>
    </Box>
  )
}
