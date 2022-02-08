import { Field } from 'formik'
import React from 'react'
import { RadioButton as RadioButtonBase } from '../base/RadioButton'

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  value: string
}

export const RadioButton: React.FC<RadioButtonProps> = (props) => {
  return <Field as={RadioButtonBase} {...props} type="radio" />
}
