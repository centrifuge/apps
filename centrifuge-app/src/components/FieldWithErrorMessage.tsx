import { Box, URLInput } from '@centrifuge/fabric'
import { Field, FieldAttributes, useField, useFormikContext } from 'formik'
import * as React from 'react'

type Props = FieldAttributes<any> & {
  label?: string | React.ReactElement
  prefix?: string
  isUrl?: boolean
}

export function FieldWithErrorMessage(props: Props) {
  const [field, meta] = useField(props)
  const form = useFormikContext()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setFieldValue(field.name, event.target.value)
  }

  return props.isUrl ? (
    <Box>
      <URLInput
        label={props.label}
        prefix={props.prefix}
        value={field.value}
        onChange={handleChange}
        name={field.name}
        placeholder={props.placeholder}
        disabled={props.disabled}
        errorMessage={meta.touched && meta.error ? meta.error : undefined}
      />
    </Box>
  ) : (
    <Field errorMessage={meta.touched ? meta.error : undefined} {...props} />
  )
}
