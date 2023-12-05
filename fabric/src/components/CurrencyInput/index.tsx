import * as React from 'react'
import styled, { css } from 'styled-components'
import { Box } from '../Box'
import { InputBox, InputBoxProps, InputUnit } from '../InputBox'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { InputAction, TextInputBox } from '../TextInput'

export type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> &
  Omit<InputBoxProps, 'inputElement' | 'rightElement'> & {
    currency?: React.ReactNode
    onSetMax?: () => void
    onChange?: (value: number | '') => void
    // TODO: Remove when deprecated inputs are removed
    variant?: 'small' | 'large'
    initialValue?: number
    precision?: number
  }

const StyledTextInput = styled.input<{ $variant?: 'small' | 'large' }>`
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

// regex from https://stackoverflow.com/questions/63091317/thousand-separator-input-with-react-hooks
function formatThousandSeparator(input: number | string): string {
  const removeNonNumeric = (typeof input === 'string' ? input : input.toString()).replace(/[^0-9.]/g, '') // remove non-numeric chars except .
  if (removeNonNumeric.includes('.')) {
    const decimalIndex = removeNonNumeric.indexOf('.')
    // add thousand separator only pre-decimal
    return `${removeNonNumeric.slice(0, decimalIndex).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${removeNonNumeric.slice(
      decimalIndex
    )}`
  }
  return removeNonNumeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const CurrencyInput_DEPRECATED: React.FC<CurrencyInputProps> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  currency,
  onSetMax,
  placeholder = '0.0',
  initialValue,
  precision = 6,
  ...inputProps
}) => {
  const [value, setValue] = React.useState(initialValue ? formatThousandSeparator(initialValue) : '')

  const onChange = (value: string) => {
    const inputFormatted = formatThousandSeparator(value)
    const inputAsNumber = parseFloat(value.replaceAll(',', ''))
    if (inputProps?.onChange) {
      inputProps?.onChange(Number.isNaN(inputAsNumber) ? '' : inputAsNumber)
      setValue(inputFormatted)
    }
  }

  // TODO: fix jank when typing more decimals than precision allows
  React.useLayoutEffect(() => {
    if (inputProps.value) {
      const inputFormatted = formatThousandSeparator(
        Math.floor((inputProps.value as number) * 10 ** precision) / 10 ** precision
      )
      setValue(inputFormatted)
    }
  }, [inputProps.value])

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
        <StyledTextInput
          {...inputProps}
          disabled={disabled}
          placeholder={placeholder}
          type="text"
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
      }
      rightElement={
        <Text variant="body1" color={disabled ? 'textDisabled' : 'textPrimary'} fontSize={'24px'}>
          {currency}
        </Text>
      }
    />
  )
}

export function CurrencyInput({
  id,
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  currency,
  onSetMax,
  placeholder = '0.0',
  initialValue,
  precision = 6,
  ...inputProps
}: CurrencyInputProps) {
  id ??= React.useId()
  const [value, setValue] = React.useState(initialValue ? formatThousandSeparator(initialValue) : '')

  const onChange = (value: string) => {
    const inputFormatted = formatThousandSeparator(value)
    const inputAsNumber = parseFloat(value.replaceAll(',', ''))
    if (inputProps?.onChange) {
      inputProps?.onChange(Number.isNaN(inputAsNumber) ? '' : inputAsNumber)
      setValue(inputFormatted)
    }
  }

  // TODO: fix jank when typing more decimals than precision allows
  React.useLayoutEffect(() => {
    if (inputProps.value) {
      const inputFormatted = formatThousandSeparator(
        Math.floor((inputProps.value as number) * 10 ** precision) / 10 ** precision
      )
      setValue(inputFormatted)
    }
  }, [inputProps.value])

  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <TextInputBox
          {...inputProps}
          disabled={disabled}
          placeholder={placeholder}
          error={!!errorMessage}
          onChange={(e) => onChange(e.target.value)}
          value={value}
          symbol={currency}
          action={
            onSetMax && (
              <InputAction onClick={onSetMax} disabled={disabled}>
                Max
              </InputAction>
            )
          }
        />
      }
    />
  )
}
