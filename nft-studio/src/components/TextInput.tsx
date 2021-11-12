import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

type TextAreaProps = {
  label: string
  onChange?: React.FormEventHandler
  value?: string
  placeholder?: string
}

const StyledTextInput = styled.input`
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.textPrimary};
  margin-top: ${({ theme }) => theme.space[1]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;

  ::placeholder {
    color: ${({ theme }) => theme.colors.borderPrimary};
  }
`

export const TextInput: React.FC<TextAreaProps> = ({ label, value, placeholder, onChange }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <StyledTextInput onChange={onChange} placeholder={placeholder || ''} value={value || ''} />
  </Stack>
)
