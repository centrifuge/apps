import * as React from 'react'
import styled from 'styled-components'
import { IconChevronDown } from '../..'
import { Box } from '../Box'
import { InputBox, InputBoxProps } from '../InputBox'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type SelectOptionItem = {
  label: string
  value: string
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  Pick<InputBoxProps, 'outlined'> & {
    options: SelectOptionItem[]
    label?: string | React.ReactElement
    placeholder?: string
    errorMessage?: string
  }

const StyledSelect = styled.select`
  appearance: none;
  background-color: transparent;
  border: none;
  padding: 0 1em 0 0;
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

export const Select: React.FC<SelectProps> = ({
  options,
  label,
  placeholder,
  errorMessage,
  disabled,
  outlined = false,
  ...rest
}) => {
  return (
    <Stack gap={1} width="100%">
      <InputBox
        width="100%"
        label={label}
        as="div"
        outlined={outlined}
        inputElement={
          <StyledSelect disabled={disabled} {...rest}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option, index) => (
              <option key={`${index}${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        }
        rightElement={<IconChevronDown color={disabled ? 'textSecondary' : 'textPrimary'} />}
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
