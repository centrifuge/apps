import { IconCheckCircle, IconCircle } from '@centrifuge/fabric'
import { Field, useField } from 'formik'
import React from 'react'
import styled from 'styled-components'
import { getRadioButtonComponent } from '../abstract/getRadioButtonComponent'

interface RadioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // label: string
  // name: string
  // value: string
}

const HiddenField = styled(Field)`
  display: none;
`

export const RadioInput: React.FC<RadioInputProps> = (props) => {
  const [field] = useField(props.name || '')

  return (
    <label>
      {field.value === props.value ? <IconCheckCircle /> : <IconCircle />}
      <HiddenField type="radio" {...field} {...props} />
    </label>
  )
}

export const RadioButton = getRadioButtonComponent(RadioInput)
