import * as React from 'react'
import { Stack } from '../Stack'
import { Text } from '../Text'

const IdContext = React.createContext('')
export const IdProvider = IdContext.Provider
export function useContextId() {
  return React.useContext(IdContext)
}

export type InputUnitProps = {
  id?: string
  label?: React.ReactNode
  secondaryLabel?: React.ReactNode
  errorMessage?: string
  inputElement?: React.ReactNode
  disabled?: boolean
}

export function InputUnit({ id, label, secondaryLabel, errorMessage, inputElement, disabled }: InputUnitProps) {
  const defaultId = React.useId()
  id ??= defaultId
  return (
    <IdContext.Provider value={id}>
      <Stack gap={1}>
        {label && <InputLabel disabled={disabled}>{label}</InputLabel>}
        <Text
          variant="body2"
          color={disabled ? 'textDisabled' : 'textPrimary'}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {inputElement}
        </Text>
        {secondaryLabel && (
          <Text variant="body3" color={disabled ? 'textDisabled' : 'textSecondary'}>
            {secondaryLabel}
          </Text>
        )}
        {errorMessage && <InputErrorMessage>{errorMessage}</InputErrorMessage>}
      </Stack>
    </IdContext.Provider>
  )
}

export function InputLabel({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <Text variant="label2" color={disabled ? 'textDisabled' : 'textSecondary'} as="label" htmlFor={useContextId()}>
      {children}
    </Text>
  )
}

export function InputErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="label2" color="statusCritical">
      {children}
    </Text>
  )
}
