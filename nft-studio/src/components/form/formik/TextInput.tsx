import { Box, Stack, Text } from '@centrifuge/fabric'
import { Field, useField } from 'formik'
import React from 'react'
import styled from 'styled-components'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  validate?: (value: string) => string | undefined
}

const StyledTextInput = styled(Field)<{ haserror: boolean }>`
  width: 100%;
  border: 0;
  border-bottom: 1px solid
    ${({ theme, haserror }) => (haserror ? theme.colors.statusCritical : theme.colors.textPrimary)};
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

const ErrorMsg = styled(Text)`
  color: ${({ theme }) => theme.colors.statusCritical};
`

export const TextInput: React.FC<TextInputProps> = ({ label, value, placeholder, ...inputProps }) => {
  const [, meta] = useField(inputProps)
  return (
    <Stack>
      <Text variant="label1">{label}</Text>
      <Text variant="body2">
        <StyledTextInput {...inputProps} haserror={meta.error && meta.touched ? '1' : ''} />
      </Text>
      {meta.error && meta.touched && (
        <Box marginTop={1}>
          <ErrorMsg variant="label2">{meta.error}</ErrorMsg>
        </Box>
      )}
    </Stack>
  )
}
