import { IconCheckCircle, IconCircle, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface RadioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const HiddenInput = styled.input`
  width: 0;
  height: 0;
  visibility: hidden;
`

export const RadioInput: React.FC<RadioInputProps> = ({ label, checked, onChange, ...inputProps }) => (
  <label htmlFor={label}>
    <Shelf gap="1">
      {checked ? <IconCheckCircle /> : <IconCircle />}
      <Text variant="interactive2">{label}</Text>
    </Shelf>
    <HiddenInput id={label} type="radio" onChange={onChange} {...inputProps} />
  </label>
)
