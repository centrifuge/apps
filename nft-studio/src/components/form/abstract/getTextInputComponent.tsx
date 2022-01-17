import { Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import styled from 'styled-components'

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const getTextInputComponent = (
  InputComponent?: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>
): React.FC<TextInputProps> => {
  const styledFunc = InputComponent ? styled(InputComponent) : styled.input
  const StyledInputComponent = styledFunc`
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
  return ({ label, ...inputProps }) => {
    return (
      <Stack>
        <Text variant="label1">{label}</Text>
        <Text variant="body2">
          <StyledInputComponent {...inputProps} />
        </Text>
      </Stack>
    )
  }
}
