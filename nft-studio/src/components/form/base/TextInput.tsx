import { Box, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  errorMessage?: string
}

const StyledTextInput = styled.input<{ hasError?: string }>`
  width: 100%;
  border: 0;
  border-bottom: 1px solid
    ${({ theme, hasError }) => (hasError ? theme.colors.statusCritical : theme.colors.textPrimary)};
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

export const TextInput: React.FC<TextInputProps> = ({ label, errorMessage, ...inputProps }) => {
  return (
    <Stack>
      <Text variant="label1">{label}</Text>
      <Text variant="body2">
        <StyledTextInput {...inputProps} hasError={errorMessage} />
      </Text>
      {errorMessage && (
        <Box marginTop={1}>
          <Text variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}
