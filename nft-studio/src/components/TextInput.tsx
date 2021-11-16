import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const StyledTextInput = styled.input`
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.textPrimary};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  height: 32px;

  ::placeholder {
    color: ${({ theme }) => theme.colors.borderPrimary};
  }
`

export const TextInput: React.FC<TextInputProps> = ({ label, value, placeholder, ...inputProps }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <StyledTextInput placeholder={placeholder || ''} value={value || ''} {...inputProps} />
  </Stack>
)
