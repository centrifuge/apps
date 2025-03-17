import { Box, FileUpload, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { StyledGrid } from './PoolStructureSection'
import { validate } from './validate'

export function PoolAnalysisSection({ isUpdating }: { isUpdating?: boolean }) {
  const formName = isUpdating ? 'pool.report' : 'report'
  return (
    <Box mt={isUpdating ? 0 : 4} mb={isUpdating ? 0 : 3}>
      {!isUpdating && <Text variant="heading2">Pool analysis</Text>}
      <StyledGrid
        gridTemplateColumns={isUpdating ? ['1fr'] : ['1fr', '1fr 1fr']}
        gap={3}
        mt={isUpdating ? 0 : 3}
        px={isUpdating ? '16px !important' : 5}
        py={isUpdating ? '24px !important' : 5}
        mb={isUpdating ? '24px !important' : 3}
      >
        <FieldWithErrorMessage
          name={`${formName}.report.url`}
          label="Report URL"
          placeholder="Type here..."
          validate={validate.websiteNotRequired()}
          as={URLInput}
        />
        <FieldWithErrorMessage
          name={`${formName}.author.name`}
          as={TextInput}
          label="Rewiewer name"
          placeholder="Type here..."
        />
        <FieldWithErrorMessage
          name={`${formName}.author.title`}
          as={TextInput}
          label="Rewiewer job title"
          placeholder="Type here..."
        />
        <Field name={`${formName}.author.avatar`}>
          {({ field, meta, form }: FieldProps) => (
            <FileUpload
              file={field.value}
              onFileChange={(file) => {
                form.setFieldValue(`${formName}.author.avatar`, file)
              }}
              label="Reviewer avatar"
              placeholder="Click to upload"
              accept="image/png, image/jpeg, image/jpg"
              onClear={() => form.setFieldValue(`${formName}.author.avatar`, null)}
              small
            />
          )}
        </Field>
      </StyledGrid>
    </Box>
  )
}
