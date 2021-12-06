import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

const StyledTextArea = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  border-radius: 8px;
  margin-top: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
`

export const TextArea: React.FC<TextAreaProps> = ({ label, value, ...textareaProps }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <Text variant="body2">
      <StyledTextArea value={value || ''} {...textareaProps} />
    </Text>
  </Stack>
)
