import * as React from 'react'
import styled from 'styled-components'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type RangeInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode
  secondaryLabel?: React.ReactNode
  errorMessage?: string
}

const StyledRangeInput = styled.input`
  width: 100%;
  margin: 0;
`

export const RangeInput: React.FC<RangeInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  ...inputProps
}) => {
  return (
    <Stack gap={1} width="100%">
      <Shelf gap={1} alignItems="baseline">
        {label && (
          <Text variant="label2" color={disabled ? 'textDisabled' : 'textSecondary'}>
            {label}
          </Text>
        )}

        {secondaryLabel && (
          <Text variant="body2" color={disabled ? 'textDisabled' : 'textPrimary'}>
            {secondaryLabel}
          </Text>
        )}
      </Shelf>
      <StyledRangeInput type="range" disabled={disabled} {...inputProps} />
      {errorMessage && (
        <Text variant="label2" color="statusCritical">
          {errorMessage}
        </Text>
      )}
    </Stack>
  )
}
