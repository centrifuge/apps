import React, { useRef } from 'react'
import styled from 'styled-components'
import { IconInfoFailed, IconSearch } from '../..'
import { Box } from '../Box'
import { InputBox, InputBoxProps } from '../InputBox'
import { Text } from '../Text'

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

  &:focus {
    color: ${({ theme }) => theme.colors.textSelected};
  }
`

export const TextInput: React.FC<TextInputProps> = ({
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
      inputElement={<StyledTextInput disabled={disabled} {...inputProps} />}
      rightElement={rightElement}
    />
  )
}

const StyledClearButtom = styled.button`
  background: none;
  padding: 0;
  border: none;
  height: 24px;
  width: 24px;
`

export const SearchInput: React.FC<Omit<TextInputProps, 'rightElement'> & { clear?: () => void }> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  clear,
  ...inputProps
}) => {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <InputBox
      ref={ref}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<StyledTextInput type="search" disabled={disabled} {...inputProps} />}
      rightElement={
        inputProps.value && clear ? (
          <StyledClearButtom
            onClick={() => {
              clear()
              ref.current?.focus()
            }}
          >
            <IconInfoFailed color="textPrimary" />
          </StyledClearButtom>
        ) : (
          <IconSearch size="iconMedium" color="textPrimary" />
        )
      }
    />
  )
}

export const DateInput: React.FC<Omit<TextInputProps, 'rightElement'>> = ({
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

export type TextAreaInputProps = React.InputHTMLAttributes<HTMLTextAreaElement> & InputBoxProps

const StyledTextArea = styled(Box)`
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  min-height: 66px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  resize: vertical;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  &:focus {
    color: ${({ theme }) => theme.colors.textSelected};
  }
`

export const TextAreaInput: React.FC<TextAreaInputProps> = ({
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
      pr={1}
      inputElement={
        <Text variant="body2">
          <StyledTextArea as="textarea" mt="4px" pr={1} disabled={disabled} {...inputProps} />
        </Text>
      }
      rightElement={rightElement}
    />
  )
}
