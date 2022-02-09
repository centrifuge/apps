import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  InputComponent?: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
}

const StyledTextInput = styled.input`
  width: 100%;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  height: 32px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;

  ::placeholder {
    color: ${({ theme }) => theme.colors.borderPrimary};
  }
`

export const TextInput: React.FC<TextInputProps> = ({ label, value, placeholder, ...inputProps }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <Text variant="body2">
      <StyledTextInput placeholder={placeholder || ''} value={value || ''} {...inputProps} />
    </Text>
  </Stack>
)
