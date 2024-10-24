import * as React from 'react'
import styled from 'styled-components'
import { IconChevronDown } from '../../icon'
import { Flex } from '../Flex'
import { InputUnit } from '../InputUnit'
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
  small?: boolean
  hideBorder?: boolean
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
  font-weight: 400;

  &:disabled {
    cursor: default;
  }
`

export function SelectInner({
  options,
  placeholder,
  disabled,
  small,
  hideBorder,
  ...rest
}: Omit<SelectProps, 'label' | 'errorMessage'>) {
  return (
    <Flex position="relative" width="100%">
      <IconChevronDown
        color={disabled ? 'textSecondary' : 'textPrimary'}
        size={small ? 'iconSmall' : 'iconMedium'}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          marginTop: 'auto',
          marginBottom: 'auto',
          pointerEvents: 'none',
        }}
      />
      <StyledSelect disabled={disabled} {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option
            key={`${index}${option.value}`}
            value={option.value}
            disabled={option.disabled}
            style={{ textAlign: hideBorder ? 'right' : 'left' }}
          >
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </Flex>
  )
}

export function Select({ label, errorMessage, id, hideBorder, ...rest }: SelectProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      disabled={rest.disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledInputBox alignItems="stretch" height="input" px={1} hideBorder={hideBorder}>
          <SelectInner id={id} {...rest} hideBorder={hideBorder} />
        </StyledInputBox>
      }
    />
  )
}
