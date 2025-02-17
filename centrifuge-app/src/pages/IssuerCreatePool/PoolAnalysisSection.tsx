import { Box, FileUpload, Text, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { StyledGrid } from './PoolStructureSection'
import { validate } from './validate'

export function PoolAnalysisSection({ isUpdating }: { isUpdating?: boolean }) {
  return (
    <Box mt={isUpdating ? 0 : 4} mb={isUpdating ? 0 : 3}>
      {!isUpdating && <Text variant="heading2">Pool analysis</Text>}
      <StyledGrid
        gridTemplateColumns={isUpdating ? ['1fr'] : ['1fr', '1fr 1fr']}
        gap={3}
        mt={isUpdating ? 0 : 3}
        style={{ padding: isUpdating ? 20 : 40 }}
      >
        <FieldWithErrorMessage
          name="reportUrl"
          label="Report URL"
          placeholder="Type here..."
          validate={validate.websiteNotRequired()}
          as={URLInput}
        />
        <FieldWithErrorMessage
          name="reportAuthorName"
          as={TextInput}
          label="Rewiewer name"
          placeholder="Type here..."
        />
        <FieldWithErrorMessage
          name="reportAuthorTitle"
          as={TextInput}
          label="Rewiewer job title"
          placeholder="Type here..."
        />
        {/* TODO: add avatar upload */}
        <Field name="reportAuthorAvatar">
          {({ field, meta, form }: FieldProps) => (
            <FileUpload
              file={field.value}
              onFileChange={(file) => {
                form.setFieldValue('reportAuthorAvatar', file)
              }}
              label="Reviewer avatar"
              placeholder="Click to upload"
              accept="image/png, image/jpeg, image/jpg"
              onClear={() => form.setFieldValue('reportAuthorAvatar', null)}
              small
            />
          )}
        </Field>
      </StyledGrid>
    </Box>
  )
}
