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
  position: absolute;
  opacity: 0;
`

const FocusableLabel = styled.label`
  :focus-within {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`

export const RadioInput: React.FC<RadioInputProps> = (props) => (
  <div>
    {props.checked ? <IconCheckCircle /> : <IconCircle />}
    <HiddenField type="radio" tabIndex={0} {...props} />
  </div>
)

export const RadioButton: React.FC<RadioButtonProps> = ({ label, ...props }) => {
  const id = props.id || props.name
  return (
    <FocusableLabel htmlFor={id}>
      <Shelf gap="1">
        <RadioInput type="radio" {...props} id={id} />
        <Text variant="interactive2">{label}</Text>
      </Shelf>
    </FocusableLabel>
  )
}
