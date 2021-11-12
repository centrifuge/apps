import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

type TextAreaProps = {
  label: string
  onChange?: React.FormEventHandler
  value?: string
}

const StyledTextArea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  border-radius: 8px;
  margin-top: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
`

export const TextArea: React.FC<TextAreaProps> = ({ label, value, onChange }) => (
  <Stack>
    <Text variant="label1">{label}</Text>
    <StyledTextArea onChange={onChange} value={value || ''} />
  </Stack>
)
