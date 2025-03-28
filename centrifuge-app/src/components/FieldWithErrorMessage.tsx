import { Field, FieldAttributes, useField } from 'formik'
import * as React from 'react'

type Props = FieldAttributes<any> & {
  label?: string | React.ReactElement
}

export function FieldWithErrorMessage(props: Props) {
  const [, meta] = useField(props)
  return <Field errorMessage={meta.touched ? meta.error : undefined} {...props} />
}
