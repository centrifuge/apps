import * as React from 'react'
import styled, { css } from 'styled-components'
import { Box } from '../Box'
import { InputBox, InputBoxProps, InputUnit } from '../InputBox'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { InputAction, TextInputBox } from '../TextInput'

export type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> &
  Omit<InputBoxProps, 'inputElement' | 'rightElement'> & {
    value: number | ''
    currency?: React.ReactNode
    onSetMax?: () => void
    onChange?: (value: number | '') => void
    // TODO: Remove when deprecated inputs are removed
    variant?: 'small' | 'large'
    decimals?: number
  }

type CurrencyInputProps_DEPRECATED = Omit<CurrencyInputProps, 'decimals'> & { precision?: number }

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

export const CurrencyInput_DEPRECATED: React.FC<CurrencyInputProps_DEPRECATED> = ({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  currency,
  onSetMax,
  placeholder = '0.0',
  precision = 6,
  ...inputProps
}) => {
  const [value, setValue] = React.useState('')

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
  decimals = 6,
  onChange,
  onBlur,
  ...inputProps
}: CurrencyInputProps) {
  id ??= React.useId()
  const ref = React.useRef<HTMLInputElement>(null)
  const [internalValue, setInternalValue] = React.useState(() =>
    typeof inputProps.value !== 'number' || Number.isNaN(inputProps.value)
      ? ''
      : formatThousandSeparator(inputProps.value)
  )
  const { recordCursor, restoreCursor } = useCursor(ref)

  function handleChange(inputStr: string) {
    recordCursor()
    // set internal value to raw unformatted input
    // in case input can't be parsed
    // call onChange with parsed number
    setInternalValue(inputStr)
    const inputAsNumber = parseAsNumber(inputStr)
    onChange?.(Number.isNaN(inputAsNumber) ? '' : inputAsNumber)
  }

  function formatDecimals(value: string | number) {
    const valueAsNumber = parseAsNumber(value)
    const formatted = formatThousandSeparator(Math.floor(valueAsNumber * 10 ** decimals) / 10 ** decimals)
    const newValueAsNumber = parseAsNumber(formatted)
    setInternalValue(formatted)
    onChange?.(newValueAsNumber)
  }

  React.useLayoutEffect(() => {
    if (inputProps.value) {
      const formatted = formatThousandSeparator(inputProps.value)
      // To prevent the `.` or zeroes disappearing when going from `1.5` -> `1.` or `1.005` -> `1.00`
      if (
        internalValue.split('.')[0] === formatted.split('.')[0] &&
        parseAsNumber(inputProps.value) === parseAsNumber(internalValue)
      ) {
        return
      }
      setInternalValue(formatted)
    }
  }, [inputProps.value])

  React.useLayoutEffect(() => {
    restoreCursor()
  }, [internalValue])

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
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => {
            // only enforce the number of decimals on blur, so as not to cause jank during typing
            formatDecimals(e.target.value)
            onBlur?.(e)
          }}
          value={internalValue}
          symbol={currency}
          action={
            onSetMax && (
              <InputAction onClick={onSetMax} disabled={disabled}>
                Max
              </InputAction>
            )
          }
          inputRef={ref}
        />
      }
    />
  )
}

function parseAsNumber(value: string | number) {
  return parseFloat(String(value).replace(/[^0-9.]/g, ''))
}

// regex from https://stackoverflow.com/questions/63091317/thousand-separator-input-with-react-hooks
function formatThousandSeparator(input: number | string): string {
  // remove non-numeric chars except first .
  const removeNonNumeric = String(input)
    .replace(/[^0-9.]/g, '')
    .replace(/\./, 'x')
    .replace(/\./g, '')
    .replace(/x/, '.')
  const parts = removeNonNumeric.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// allows maintaining the cursor position when adding/removing characters at the start or in the middle of the input
export function useCursor(inputRef: React.RefObject<HTMLInputElement>) {
  const selectionRef = React.useRef<{
    start?: number | null
    end?: number | null
    value?: string
    before?: string
    after?: string
  }>()

  function recordCursor() {
    if (!inputRef.current) return
    try {
      const { selectionStart: start, selectionEnd: end, value } = inputRef.current
      const before = value.slice(0, start ?? 0)
      const after = value.slice(end ?? 0)

      selectionRef.current = {
        start,
        end,
        value,
        before,
        after,
      }
    } catch (e) {
      //
    }
  }

  function restoreCursor() {
    const input = inputRef.current
    if (input && selectionRef.current && input === document.activeElement) {
      try {
        const { value } = input
        const { before, after, start } = selectionRef.current

        let startPos = value.length

        if (value.endsWith(after!)) {
          startPos = value.length - (after!.length ?? 0)
        } else if (value.startsWith(before!)) {
          startPos = before!.length
        } else if (before) {
          const beforeLastChar = before[(start ?? 0) - 1]
          const newIndex = value.indexOf(beforeLastChar, (start ?? 0) - 1)
          if (newIndex !== -1) {
            startPos = newIndex + 1
          }
        }

        input.setSelectionRange(startPos, startPos)
      } catch (e) {
        //
      }
    }
  }

  return { recordCursor, restoreCursor }
}
