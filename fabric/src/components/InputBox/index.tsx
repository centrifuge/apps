import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Box } from '../Box'
import { Shelf } from '../Shelf'
import { Stack, StackProps } from '../Stack'
import { Text } from '../Text'

export type InputBoxProps = {
  label?: React.ReactNode
  secondaryLabel?: React.ReactNode
  errorMessage?: string
  inputElement?: React.ReactNode
  rightElement?: React.ReactNode
  disabled?: boolean
  active?: boolean
  outlined?: boolean
}

const InputWrapper = styled(Stack)<{ $active?: boolean; $disabled?: boolean }>`
  border: 1px solid;
  text-align: left;
  border-radius: 10px;
  background: ${({ theme, $disabled }) => ($disabled ? theme.colors.backgroundPage : theme.colors.backgroundInput)};
  border-color: ${({ theme, $disabled, $active }) =>
    $disabled ? theme.colors.backgroundSecondary : $active ? theme.colors.textSelected : theme.colors.grayScale[300]};
  &:focus,
  &:focus-within {
    border-color: var(--fabric-focus);
  }
`

export const InputBox: React.FC<StackProps & InputBoxProps> = React.forwardRef(
  ({ label, secondaryLabel, errorMessage, inputElement, rightElement, disabled, active, ...boxProps }, ref) => {
    const theme = useTheme()
    return (
      <Stack gap={1} width="100%">
        <InputWrapper gap="4px" px={2} py={1} as="label" $active={active} $disabled={disabled} {...boxProps} ref={ref}>
          {label && (
            <Text variant="label2" color={disabled ? 'textDisabled' : 'textSecondary'}>
              {label}
            </Text>
          )}
          <Stack>
            <Shelf>
              <Box flex="1 1 auto" minWidth={0} position="relative">
                <Text
                  variant="body1"
                  color={disabled ? 'textDisabled' : 'textPrimary'}
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {inputElement}
                </Text>
              </Box>
              {rightElement && (
                <Box
                  as={Text}
                  flex="0 0 auto"
                  display="flex"
                  style={{ color: theme.colors[disabled ? 'textDisabled' : 'textPrimary'] }}
                >
                  {rightElement}
                </Box>
              )}
            </Shelf>
            {secondaryLabel && (
              <Text variant="body3" color={disabled ? 'textDisabled' : 'textSecondary'}>
                {secondaryLabel}
              </Text>
            )}
          </Stack>
        </InputWrapper>
        {errorMessage && (
          <Box px={2}>
            <Text variant="label2" color="statusCritical">
              {errorMessage}
            </Text>
          </Box>
        )}
      </Stack>
    )
  }
)

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

export function InputUnit({
  id,
  label,
  secondaryLabel,
  errorMessage,
  inputElement,
  disabled,
}: StackProps & InputUnitProps) {
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
