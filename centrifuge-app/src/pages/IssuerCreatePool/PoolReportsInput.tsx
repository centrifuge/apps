import { FileUpload, Grid, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { combineAsync, imageFile, maxFileSize, maxImageSize } from '../../utils/validation'
import { validate } from './validate'

export function PoolReportsInput() {
  return (
    <Grid columns={[1, 2]} equalColumns gap={2} rowGap={3}>
      <FieldWithErrorMessage
        name="reportUrl"
        as={TextInput}
        label="Report URL*"
        placeholder="https://..."
        validate={validate.website}
      />
      <FieldWithErrorMessage
        name="reportAuthorName"
        as={TextInput}
        label="Reviewer name*"
        placeholder="Name..."
        maxLength={100}
      />
      <FieldWithErrorMessage
        name="reportAuthorTitle"
        as={TextInput}
        label="Reviewer job title*"
        placeholder="Title..."
        maxLength={100}
      />
      <Field
        name="reportAuthorAvatar"
        validate={combineAsync(imageFile(), maxFileSize(1024 ** 2), maxImageSize(200, 200))}
      >
        {({ field, meta, form }: FieldProps) => (
          <FileUpload
            file={field.value}
            onFileChange={(file) => {
              form.setFieldTouched('reportAuthorAvatar', true, false)
              form.setFieldValue('reportAuthorAvatar', file)
            }}
            label="Reviewer avatar (JPG/PNG/SVG, max 40x40px)"
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
            accept="image/*"
          />
        )}
      </Field>
    </Grid>
  )
}
