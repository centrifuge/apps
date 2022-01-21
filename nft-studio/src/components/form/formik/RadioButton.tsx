import { Field, useField } from 'formik'
import React from 'react'
import { RadioButton as RadioButtonBase } from '../base/RadioButton'

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  value: string
}

export const RadioButton: React.FC<RadioButtonProps> = (props) => {
  const [field] = useField<string>(props)
  return <Field as={RadioButtonBase} {...props} checked={field.value === props.value} />
}
