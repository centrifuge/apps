import { Field, useField } from 'formik'
import React from 'react'
import { TextInput as TextInputBase } from '../base/TextInput'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  validate?: (value: string) => string | undefined
}

export const TextInput: React.FC<TextInputProps> = (props) => {
  const [, meta] = useField<TextInputProps>(props)
  return (
    <Field
      as={TextInputBase}
      errorMessage={meta.touched ? meta.error : undefined}
      validate={props.validate}
      {...props}
    />
  )
}
