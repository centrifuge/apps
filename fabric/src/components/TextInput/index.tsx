import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress as isSubstrateAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex, IconCentrifuge, IconEthereum, IconLoader, IconSearch } from '../..'
import { InputBoxProps, InputUnit, InputUnitProps, useContextId } from '../InputBox'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  InputUnitProps & {
    action?: React.ReactNode
    symbol?: React.ReactNode
  }
export type TextAreaInputProps = React.InputHTMLAttributes<HTMLTextAreaElement> &
  InputUnitProps & {
    action?: React.ReactNode
    symbol?: React.ReactNode
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
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  // For number input
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

export const StyledInputBox = styled(Shelf)`
  width: 100%;
  position: relative;
  background: ${({ theme }) => theme.colors.backgroundPage};
  border: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  border-radius: ${({ theme }) => theme.radii.input}px;

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
  background: ${(props) => props.theme.colors.backgroundButtonSecondary};
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: inherit;
  padding: 0 12px;
  box-shadow: 0 0 0 1px ${(props) => props.theme.colors.borderSecondary};
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
export function InputAction({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <StyledInputAction type="button" {...props}>
      <Text variant="interactive1" color="textSecondary" fontWeight={400}>
        {children}
      </Text>
    </StyledInputAction>
  )
}

export function TextInputBox(
  props: Omit<TextInputProps, 'label' | 'secondaryLabel'> & {
    error?: boolean
    inputRef?: React.Ref<HTMLInputElement>
  }
) {
  const { error, disabled, action, symbol, inputRef, inputElement, ...inputProps } = props
  return (
    <StyledInputBox alignItems="stretch" height="input">
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
          symbol={<IconSearch size="iconMedium" color="textPrimary" />}
          {...inputProps}
        />
      }
    />
  )
}

export function DateInput({ label, secondaryLabel, disabled, errorMessage, id, ...inputProps }: TextInputProps) {
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
          type="date"
          disabled={disabled}
          error={!!errorMessage}
          required // hides the reset button in Firefox
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
  min-height: 66px;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  resize: vertical;
  padding: ${({ theme }) => theme.space[1]}px;

  ::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
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

type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> &
  Omit<InputBoxProps, 'inputElement' | 'rightElement'>

export const AddressInput = ({
  id,
  label,
  secondaryLabel,
  disabled,
  errorMessage,
  onBlur,
  onChange,
  ...inputProps
}: CurrencyInputProps) => {
  const defaultId = React.useId()
  id ??= defaultId

  const [network, setNetwork] = React.useState<'ethereum' | 'centrifuge' | 'loading' | null>(null)

  function handleChange(e: React.FocusEvent<HTMLInputElement>) {
    const address = e.target.value
    if (isEvmAddress(address) && address.length > 3) {
      setNetwork('ethereum')
    } else if (isSubstrateAddress(address) && address.length > 3) {
      setNetwork('centrifuge')
    } else if (address !== '') {
      setNetwork('loading')
    } else {
      setNetwork(null)
    }

    if (onChange) {
      onChange(e)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const address = e.target.value
    if (!(isSubstrateAddress(address) || isEvmAddress(address))) {
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
          action={
            network && (
              <Shelf
                gap={1}
                p="8px"
                border="1px solid"
                borderColor="borderSecondary"
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
