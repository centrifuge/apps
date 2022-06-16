import React from 'react'
import styled, { css } from 'styled-components'
import { Box } from '../Box'
import { InputBox, InputBoxProps } from '../InputBox'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type CurrencyInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  Omit<InputBoxProps, 'inputElement' | 'rightElement'> & {
    currency?: string
    onSetMax?: () => void
    variant?: 'small' | 'large'
  }

const StyledTextInput = styled.input<{ $variant: 'small' | 'large' }>`
  width: 100%;
  border: 0;
  background: transparent;
  height: 36px;
  font-size: 24px;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  -moz-appearance: textfield;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  &:focus {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  ${({ $variant }) =>
    $variant === 'small' &&
    css({
      fontSize: '16px',
      height: '20px',
    })}
`

const StyledMaxButton = styled(Box)`
  padding: 0 8px;
  border: 0;
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background-color: ${({ theme }) => theme.colors.backgroundPrimary};
  cursor: pointer;
  appearance: none;

  &:disabled {
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  &:focus-visible {
    box-shadow: ${({ theme }) => theme.shadows.buttonActive};
  }
`.withComponent('button')

StyledMaxButton.defaultProps = {
  type: 'button',
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  currency,
  onSetMax,
  placeholder = '0.0',
  variant = 'large',
  ...inputProps
}) => {
  return (
    <InputBox
      label={label}
      secondaryLabel={
        <Shelf justifyContent="space-between">
          <span>{secondaryLabel}</span>
          {onSetMax && (
            <StyledMaxButton onClick={onSetMax} disabled={disabled}>
              <Text variant="label3" lineHeight={1.5} color="inherit">
                MAX
              </Text>
            </StyledMaxButton>
          )}
        </Shelf>
      }
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledTextInput disabled={disabled} placeholder={placeholder} type="text" {...inputProps} $variant={variant} />
      }
      rightElement={
        <Text
          variant="body1"
          color={disabled ? 'textDisabled' : 'textPrimary'}
          fontSize={variant === 'small' ? '16px' : '24px'}
        >
          {currency}
        </Text>
      }
    />
  )
}
