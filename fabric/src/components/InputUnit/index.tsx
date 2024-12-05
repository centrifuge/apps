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
  row?: boolean
}

export function InputUnit({ id, label, secondaryLabel, errorMessage, inputElement, disabled, row }: InputUnitProps) {
  const defaultId = React.useId()
  id ??= defaultId

  return (
    <IdContext.Provider value={id}>
      <Stack gap={row ? 0 : 1} flexDirection={row ? 'row' : 'column'} alignItems={row ? 'center' : null}>
        {label && (
          <InputLabel row={row} disabled={disabled}>
            {label}
          </InputLabel>
        )}
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
          <Text variant="body3" color={disabled ? 'textDisabled' : 'textPrimary'} style={{ textAlign: 'right' }}>
            {secondaryLabel}
          </Text>
        )}
        {errorMessage && <InputErrorMessage>{errorMessage}</InputErrorMessage>}
      </Stack>
    </IdContext.Provider>
  )
}

export function InputLabel({
  children,
  disabled,
  row,
}: {
  children: React.ReactNode
  disabled?: boolean
  row?: boolean
}) {
  return (
    <Text
      variant={row ? 'heading3' : 'heading4'}
      color={disabled ? 'textDisabled' : 'textPrimary'}
      as="label"
      htmlFor={useContextId()}
    >
      {children}
    </Text>
  )
}

export function InputErrorMessage({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <Text variant="label2" color="statusCritical" style={{ ...style }}>
      {children}
    </Text>
  )
}
