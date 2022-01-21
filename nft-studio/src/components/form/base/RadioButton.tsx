import { IconCheckCircle, IconCircle, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface RadioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
}

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  value: string
  checked: boolean
}

const HiddenField = styled.input`
  display: none;
`

const FocusableLabel = styled.label`
  :focus {
    color: ${({ theme }) => theme.colors.brand};
  }
`

export const RadioInput: React.FC<RadioInputProps> = (props) => (
  <label tabIndex={-1}>
    {props.checked ? <IconCheckCircle /> : <IconCircle />}
    <HiddenField type="radio" tabIndex={-1} {...props} />
  </label>
)

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
