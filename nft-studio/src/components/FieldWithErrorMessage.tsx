import { Field, FieldAttributes, useField } from 'formik'
import React from 'react'

type Props = FieldAttributes<any> & {
  label?: string | React.ReactElement
}

export const FieldWithErrorMessage: React.FC<Props> = (props) => {
  const [, meta] = useField(props)
  return <Field errorMessage={meta.touched ? meta.error : undefined} {...props} />
}
