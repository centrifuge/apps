import * as React from 'react'
import styled from 'styled-components'
import { IconChevronDown } from '../../icon'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { InputBox, InputUnit } from '../InputBox'
import { Stack } from '../Stack'
import { Text } from '../Text'
import { StyledInputBox } from '../TextInput'

export type SelectOptionItem = {
  label: React.ReactNode
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
  padding-right: ${({ theme }) => `${theme.sizes.iconMedium + theme.space[1]}px`};
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
  bottom: 0;
  margin-top: auto;
  margin-bottom: auto;
  pointer-events: none;
`

export function SelectInner_DEPRECATED({
  options,
  placeholder,
  disabled,
  ...rest
}: Omit<SelectProps, 'label' | 'errorMessage'>) {
  return (
    <Box position="relative" width="100%">
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
    </Box>
  )
}

export function SelectInner({ options, placeholder, disabled, ...rest }: Omit<SelectProps, 'label' | 'errorMessage'>) {
  return (
    <Flex position="relative" width="100%">
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
    </Flex>
  )
}

export const Select_DEPRECATED: React.FC<SelectProps> = ({ label, errorMessage, ...rest }) => {
  return (
    <Stack gap={1} width="100%">
      <InputBox as="div" label={label} inputElement={<SelectInner {...rest} />} />
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

export function Select({ label, errorMessage, id, ...rest }: SelectProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      errorMessage={errorMessage}
      inputElement={
        <StyledInputBox alignItems="stretch" height="input" px={1}>
          <SelectInner id={id} {...rest} />
        </StyledInputBox>
      }
    />
  )
}
