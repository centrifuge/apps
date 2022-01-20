import { IconCheckCircle, IconCircle, Shelf, Text } from '@centrifuge/fabric'
import { Field, useField } from 'formik'
import React from 'react'
import styled from 'styled-components'

interface RadioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
}

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  value: string
}

const HiddenField = styled(Field)`
  display: none;
`

const FocusableLabel = styled.label`
  :focus {
    color: ${({ theme }) => theme.colors.brand};
  }
`

export const RadioInput: React.FC<RadioInputProps> = (props) => {
  const [field] = useField(props.name)

  return (
    <label>
      {field.value === props.value ? <IconCheckCircle /> : <IconCircle />}
      <HiddenField type="radio" tabIndex={-1} {...field} {...props} />
    </label>
  )
}

export const RadioButton: React.FC<RadioButtonProps> = ({ label, ...props }) => {
  const id = props.id || props.name
  return (
    <FocusableLabel tabIndex={0} htmlFor={id}>
      <Shelf gap="1">
        <RadioInput type="radio" {...props} id={id} />
        <Text variant="interactive2">{label}</Text>
      </Shelf>
    </FocusableLabel>
  )
}
