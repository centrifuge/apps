import { Box, FileUpload, FileUploadProps, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useField, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { LabelWithDeleteButton } from './IssuerCategories'
import { AddButton } from './PoolDetailsSection'
import { StyledGrid } from './PoolStructureSection'

interface ReportFileUploadProps extends FileUploadProps {
  name: string
}

function ReportFileUpload({ name, ...props }: ReportFileUploadProps) {
  const { setFieldValue } = useFormikContext<any>()
  const [field, meta] = useField(name)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (typeof field.value === 'string' && field.value) {
      fetch(field.value)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.blob()
        })
        .then((blob) => {
          const fileFromUrl = new File([blob], 'report.pdf', { type: blob.type })
          setFile(fileFromUrl)
          if (!(field.value instanceof File)) {
            setFieldValue(name, fileFromUrl)
          }
        })
        .catch((error) => {
          console.error('Error converting URL to file:', error)
        })
    } else if (field.value instanceof File) {
      setFile(field.value)
    }
  }, [field.value, name, setFieldValue])

  return (
    <FileUpload
      file={file}
      onFileChange={(newFile) => {
        setFile(newFile)
        setFieldValue(name, newFile)
      }}
      onClear={() => {
        setFile(null)
        setFieldValue(name, null)
      }}
      errorMessage={meta.touched && meta.error ? meta.error : undefined}
      {...props}
    />
  )
}

export const PoolRatingsSection = ({ isUpdating }: { isUpdating?: boolean }) => {
  const form = useFormikContext<any>()

  return (
    <Box mt={isUpdating ? 0 : 4} mb={isUpdating ? 0 : 3}>
      {isUpdating ? <></> : <Text variant="heading2">Pool rating</Text>}
      <StyledGrid
        gridTemplateColumns={isUpdating ? ['1fr'] : ['1fr', '1fr 1fr']}
        mt={isUpdating ? 0 : 3}
        style={isUpdating ? { padding: 20 } : { padding: 40 }}
      >
        <FieldArray name="poolRatings">
          {({ push, remove }) => (
            <>
              {form.values.poolRatings.map((_: any, index: number) => (
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
                    {() => (
                      <ReportFileUpload
                        name={`poolRatings.${index}.reportFile`}
                        accept="application/pdf"
                        label="Rating report PDF"
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
