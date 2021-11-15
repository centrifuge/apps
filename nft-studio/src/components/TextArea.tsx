import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

const StyledTextArea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  border-radius: 8px;
  margin-top: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
`

export const TextArea: React.FC<TextAreaProps> = ({ label, value, ...textareaProps }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <StyledTextArea value={value || ''} {...textareaProps} />
  </Stack>
)
