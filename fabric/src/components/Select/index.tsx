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
  variant?: 'primary' | 'secondary'
}

const StyledSelect = styled.select<{ variant?: 'primary' | 'secondary' }>`
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
  font-weight: ${({ variant }) => (variant === 'secondary' ? 500 : 400)};
  color: ${({ theme, variant }) => (variant === 'secondary' ? theme.colors.textDisabled : theme.colors.textPrimary)};

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
  variant,
  ...rest
}: Omit<SelectProps, 'label' | 'errorMessage'>) {
  return (
    <Flex position="relative" width="100%">
      <IconChevronDown
        color="textSecondary"
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
      <StyledSelect disabled={disabled} {...rest} variant={variant}>
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
            style={{
              textAlign: hideBorder ? 'right' : 'left',
            }}
          >
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </Flex>
  )
}

export function Select({ label, errorMessage, id, hideBorder, variant = 'primary', ...rest }: SelectProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      disabled={rest.disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledInputBox
          alignItems="stretch"
          height="input"
          px={1}
          hideBorder={hideBorder}
          background={variant === 'secondary' ? 'transparent' : 'background'}
        >
          <SelectInner id={id} {...rest} hideBorder={hideBorder} variant={variant} />
        </StyledInputBox>
      }
    />
  )
}
