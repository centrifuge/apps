import * as React from 'react'
import styled from 'styled-components'
import { IconChevronDown } from '../..'
import { Box } from '../Box'
import { InputBox } from '../InputBox'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type SelectOptionItem = {
  label: string
  value: string
  disabled?: boolean
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOptionItem[]
  label?: string | React.ReactElement
  placeholder?: string
  errorMessage?: string
}

const StyledSelect = styled.select`
  appearance: none;
  background-color: transparent;
  border: none;
  padding: ${({ theme }) => `0 ${theme.sizes.iconMedium}px 0 0`};
  margin: 0;
  width: 100%;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  line-height: inherit;
  text-overflow: ellipsis;

  &:disabled {
    cursor: default;
  }

  &:focus {
    color: ${({ theme }) => theme.colors.textSelected};
  }
`

const Chevron = styled(IconChevronDown)`
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
`

export const Select: React.FC<SelectProps> = ({ options, label, placeholder, errorMessage, disabled, ...rest }) => {
  return (
    <Stack gap={1} width="100%">
      <InputBox
        as="div"
        label={label}
        inputElement={
          <>
            <Chevron color={disabled ? 'textSecondary' : 'textPrimary'} />
            <StyledSelect disabled={disabled} {...rest}>
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option, index) => (
                <option key={`${index}${option.value}`} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </StyledSelect>
          </>
        }
      />
      {errorMessage && (
        <Box px={2}>
          <Text variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Stack>
  )
}
