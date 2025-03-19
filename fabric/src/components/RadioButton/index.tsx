import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type RadioButtonProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  errorMessage?: string
  textStyle?: string
}

export const RadioButton = ({
  label,
  disabled = false,
  icon,
  sublabel,
  height,
  styles,
  border = false,
  ...props
}: {
  name: string
  sublabel?: string
  icon?: React.ReactNode
  height?: number
  styles?: React.CSSProperties
  label: string
  value?: string | number
  disabled?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  checked?: boolean
  id?: string
  border?: boolean
} & RadioButtonProps) => {
  const theme = useTheme()

  return (
    // @ts-expect-error
    <Box
      backgroundColor={theme.colors.backgroundPrimary}
      borderRadius={8}
      border={border ? `1px solid ${theme.colors.borderPrimary}` : 'none'}
      display="flex"
      flexDirection={icon ? 'row' : 'column'}
      justifyContent={icon ? 'space-between' : 'center'}
      height={height}
      alignItems={icon ? 'center' : 'flex-start'}
      {...styles}
    >
      <RadioButtonInput label={label} disabled={disabled} {...props} />
      {icon && <Box ml={3}>{icon}</Box>}
      {sublabel && (
        <Text variant="body2" color="textSecondary" style={{ marginLeft: 26, lineHeight: 'normal' }}>
          {sublabel}
        </Text>
      )}
    </Box>
  )
}

export function RadioButtonInput({ label, errorMessage, textStyle, ...radioProps }: RadioButtonProps) {
  const theme = useTheme()
  return (
    <label htmlFor={radioProps.id}>
      <Shelf
        as={Text}
        gap={1}
        alignItems="baseline"
        backgroundColor={theme.colors.backgroundPrimary}
        px={1}
        py={1}
        borderRadius={8}
      >
        <StyledWrapper minWidth="18px" height="18px" flex="0 0 18px">
          <StyledRadioButton type="radio" {...radioProps} />
          <StyledOutline />
        </StyledWrapper>
        <Stack gap={1} flex={1}>
          <Text variant={textStyle ?? 'body2'} color={radioProps.disabled ? 'textDisabled' : 'textPrimary'}>
            {label}
          </Text>
          {errorMessage && (
            <Text variant="label2" color="statusCritical">
              {errorMessage}
            </Text>
          )}
        </Stack>
      </Shelf>
    </label>
  )
}

const StyledOutline = styled.span`
  display: none;
  pointer-events: none;
  position: absolute;
  top: -4px;
  right: -4px;
  bottom: -4px;
  left: -4px;
  border: 2px solid var(--fabric-focus);
  border-radius: 20px;
  border-color: ${({ theme }) => theme.colors.textPrimary};
`

const StyledWrapper = styled(Flex)`
  position: relative;

  &::before {
    content: '.';
    width: 0;
    visibility: hidden;
    align-self: center;
  }
`

const StyledRadioButton = styled.input`
  width: 18px;
  height: 18px;
  align-self: center;
  margin: -20px 0;
  appearance: none;
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  border-radius: 50%;
  position: relative;
  cursor: pointer;

  &:checked {
    border-color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:checked::after {
    content: '';
    width: 8px;
    height: 8px;
    background: ${({ theme }) => theme.colors.textPrimary};
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &:focus-visible + span {
    display: block;
  }
`
