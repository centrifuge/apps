import { isAddress as isSubstrateAddress } from '@polkadot/util-crypto'
import { isAddress as isEvmAddress } from 'ethers'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { Box, Flex, IconCentrifuge, IconEthereum, IconLoader, IconSearch } from '../..'
import { InputUnit, InputUnitProps, useContextId } from '../InputUnit'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  InputUnitProps & {
    action?: React.ReactNode
    symbol?: React.ReactNode
    row?: boolean
  }
export type TextAreaInputProps = React.InputHTMLAttributes<HTMLTextAreaElement> &
  InputUnitProps & {
    action?: React.ReactNode
    symbol?: React.ReactNode
  }

export type URLInputProps = TextInputProps & {
  prefix?: string
}

export const StyledTextInput = styled.input`
  width: 100%;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0 ${({ theme }) => theme.space[1]}px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  -moz-appearance: textfield;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 400;
    line-height: 24px;
  }

  // For number input
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  // For number input
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`
export const StyledInputBox = styled(Shelf)<{ hideBorder?: boolean; disabled?: boolean; background?: string }>`
  width: 100%;
  position: relative;
  background: ${({ theme, disabled, background }) =>
    disabled ? 'transparent' : background || theme.colors.backgroundPage};
  border: ${({ hideBorder, theme }) => (hideBorder ? 'none' : `1px solid ${theme.colors.borderPrimary}`)};
  border-radius: ${({ hideBorder, theme }) => (hideBorder ? 'none' : `${theme.radii.input}px`)};

  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    z-index: 2;
    border-radius: inherit;
  }

  &:has(input:focus)::before,
  &:has(select:focus)::before,
  &:has(textarea:focus)::before {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.focus};
  }
`

export const StyledInputAction = styled.button`
  cursor: pointer;
  appearance: none;
  border: none;
  background: ${(props) => props.theme.colors.backgroundButtonInverted};
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: inherit;
  padding: 0 12px;
  box-shadow: 0 0 0 1px ${(props) => props.theme.colors.borderPrimary};
  border-radius: ${({
    theme: {
      radii: { input },
    },
  }) => `0 ${input}px ${input}px 0`};

  &:focus-visible {
    box-shadow: 0 0 0 1px ${(props) => props.theme.colors.focus};
  }
  &:disabled {
    opacity: 0.4;
  }
`

const StyledURLInputWrapper = styled(StyledInputBox)`
  display: flex;
  align-items: center;
`
const Prefix = styled(Box)`
  padding: 0.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: transparent;
  font-size: 16px;
  pointer-events: none;
  border-right: 1px solid ${({ theme }) => theme.colors.borderPrimary};
`

export function URLInput({
  label,
  secondaryLabel,
  prefix = 'https://',
  disabled,
  errorMessage,
  id,
  ...inputProps
}: URLInputProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledURLInputWrapper hideBorder={!!inputProps.row} alignItems="stretch" height="input" disabled={disabled}>
          <Prefix>{prefix}</Prefix>
          <StyledTextInput {...inputProps} id={id} disabled={disabled} placeholder={inputProps.placeholder} />
        </StyledURLInputWrapper>
      }
    />
  )
}

export function InputAction({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledInputAction type="button" {...props}>
      <Text variant="interactive1" color="textButtonInverted" fontWeight={400}>
        {children}
      </Text>
    </StyledInputAction>
  )
}

export function TextInputBox(
  props: Omit<TextInputProps, 'label' | 'secondaryLabel'> & {
    error?: boolean
    inputRef?: React.Ref<HTMLInputElement>
    row?: boolean
  }
) {
  const { error, disabled, action, symbol, inputRef, inputElement, row, ...inputProps } = props
  return (
    <StyledInputBox hideBorder={!!row} alignItems="stretch" height="input" disabled={disabled}>
      {inputElement ?? <StyledTextInput disabled={disabled} {...inputProps} id={useContextId()} ref={inputRef} />}
      {symbol && (
        <Flex alignSelf="center" pr={1}>
          {symbol}
        </Flex>
      )}
      <Flex>{action}</Flex>
    </StyledInputBox>
  )
}

export function TextInput({ label, secondaryLabel, disabled, errorMessage, id, ...inputProps }: TextInputProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<TextInputBox disabled={disabled} error={!!errorMessage} {...inputProps} />}
    />
  )
}

export function SearchInput({ label, secondaryLabel, disabled, errorMessage, id, ...inputProps }: TextInputProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <TextInputBox
          type="search"
          disabled={disabled}
          error={!!errorMessage}
          symbol={<IconSearch size="iconSmall" color="textSecondary" />}
          {...inputProps}
        />
      }
    />
  )
}

export function DateInput({ label, secondaryLabel, disabled, errorMessage, id, row, ...inputProps }: TextInputProps) {
  const defaultId = React.useId()
  id ??= defaultId

  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      row={row}
      inputElement={
        <TextInputBox
          type="date"
          disabled={disabled}
          error={!!errorMessage}
          required // hides the reset button in Firefox
          row={row}
          {...inputProps}
        />
      }
    />
  )
}

export function NumberInput({ label, secondaryLabel, disabled, errorMessage, id, ...inputProps }: TextInputProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={<TextInputBox type="number" disabled={disabled} error={!!errorMessage} {...inputProps} />}
    />
  )
}

const StyledTextArea = styled.textarea`
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  min-height: 140px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  resize: none;
  padding: ${({ theme }) => theme.space[1]}px;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

export function TextAreaInput({
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  id,
  ...inputProps
}: TextAreaInputProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <InputUnit
      id={id}
      label={label}
      secondaryLabel={secondaryLabel}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <StyledInputBox>
          <StyledTextArea id={id} disabled={disabled} {...inputProps} />
        </StyledInputBox>
      }
    />
  )
}

export type AddressInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> &
  Omit<InputUnitProps, 'inputElement'> & {
    value?: string
    clearIcon?: boolean
  }

export function AddressInput({
  id,
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  onBlur,
  onChange,
  value = '',
  clearIcon,
  ...inputProps
}: AddressInputProps) {
  const defaultId = React.useId()
  id ??= defaultId

  const [network, setNetwork] = React.useState<'ethereum' | 'centrifuge' | 'loading' | null>(null)

  React.useEffect(() => {
    if (isEvmAddress(value) && value.length > 3) {
      setNetwork('ethereum')
    } else if (isSubstrateAddress(value) && value.length > 3) {
      setNetwork('centrifuge')
    } else if (value !== '') {
      setNetwork('loading')
    } else {
      setNetwork(null)
    }
  }, [value])

  function handleChange(e: React.FocusEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const address = e.target.value
    if (!(isSubstrateAddress(address) || isEvmAddress(address)) || clearIcon) {
      setNetwork(null)
    }

    if (onBlur) {
      onBlur(e)
    }
  }

  return (
    <InputUnit
      label={label}
      disabled={disabled}
      errorMessage={errorMessage}
      inputElement={
        <TextInputBox
          {...inputProps}
          disabled={disabled}
          type="text"
          onChange={handleChange}
          onBlur={handleBlur}
          value={value}
          action={
            network && (
              <Shelf
                gap={1}
                p="8px"
                border="1px solid"
                borderColor="borderPrimary"
                backgroundColor="backgroundPage"
                borderRadius="input"
              >
                {network === 'ethereum' ? (
                  <IconEthereum size="20px" />
                ) : network === 'centrifuge' ? (
                  <IconCentrifuge size="20px" />
                ) : network === 'loading' ? (
                  <SpinningIconLoader size="20px" />
                ) : null}
              </Shelf>
            )
          }
        />
      }
    />
  )
}

const rotate = keyframes`
	0% {
		transform: rotate(0);
	}

	100% {
		transform: rotate(1turn);
	}
`

const SpinningIconLoader = styled(IconLoader)`
  animation: ${rotate} 3s linear infinite;
`
