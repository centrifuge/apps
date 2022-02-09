import React from 'react'
import styled from 'styled-components'
import { IconSearch } from '../..'
import { InputBox, InputBoxProps } from '../InputBox'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & InputBoxProps

const StyledTextInput = styled.input`
  width: 100%;
  border: 0;
  background: transparent;
  height: 22px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
  }
`

export const TextInput: React.FC<TextInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  ...inputProps
}) => {
  return (
    <InputBox
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<StyledTextInput disabled={disabled} {...inputProps} />}
    />
  )
}

export const SearchInput: React.FC<TextInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  ...inputProps
}) => {
  return (
    <InputBox
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<StyledTextInput type="search" disabled={disabled} {...inputProps} />}
      rightElement={<IconSearch size="iconSmall" color="textPrimary" />}
    />
  )
}

export const DateInput: React.FC<TextInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  ...inputProps
}) => {
  return (
    <InputBox
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledTextInput
          type="date"
          disabled={disabled}
          required // hides the reset button in Firefox
          {...inputProps}
        />
      }
      // rightElement={<IconClockForward size="iconSmall" color="textPrimary" />}
    />
  )
}

const StyledNumberInput = styled(StyledTextInput)`
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

export const NumberInput: React.FC<TextInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  rightElement,
  ...inputProps
}) => {
  return (
    <InputBox
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<StyledNumberInput type="number" disabled={disabled} {...inputProps} />}
      rightElement={rightElement}
    />
  )
}
