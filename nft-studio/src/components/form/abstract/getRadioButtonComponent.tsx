import { Shelf, Text } from '@centrifuge/fabric'
import React from 'react'

export interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const getRadioButtonComponent = (
  InputComponent?: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
): React.FC<RadioButtonProps> => {
  const Input = InputComponent ? InputComponent : React.createFactory('input')

  return ({ label, ...inputProps }) => {
    return (
      <label htmlFor={inputProps.id}>
        <Shelf gap="1">
          <Input type="radio" id={inputProps.id} {...inputProps} />
          <Text variant="interactive2">{label}</Text>
        </Shelf>
      </label>
    )
  }
}
