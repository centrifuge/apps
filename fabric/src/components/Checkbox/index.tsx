import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../Box'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string | React.ReactElement
  errorMessage?: string
  extendedClickArea?: boolean
}

export const Checkbox: React.VFC<CheckboxProps> = ({ label, errorMessage, extendedClickArea, ...checkboxProps }) => {
  return (
    <Box position="relative">
      <StyledLabel $extendedClickArea={!!extendedClickArea}>
        <Shelf as={Text} gap={1} alignItems="center" position="relative">
          <StyledWrapper minWidth="18px" height="18px" flex="0 0 18px" $hasLabel={!!label}>
            <StyledCheckbox type="checkbox" {...checkboxProps} />
            <StyledOutline />
          </StyledWrapper>
          {label && (
            <Stack gap={1} flex={1}>
              {typeof label === 'string' && (
                <Text variant="body1" color={checkboxProps.disabled ? 'textDisabled' : 'textPrimary'}>
                  {label}
                </Text>
              )}
              {React.isValidElement(label) && label}
              {errorMessage && (
                <Text variant="label2" color="statusCritical">
                  {errorMessage}
                </Text>
              )}
            </Stack>
          )}
        </Shelf>
      </StyledLabel>
      {!label && errorMessage && (
        <Box mt={1}>
          <Text variant="label2" color="statusCritical">
            {errorMessage}
          </Text>
        </Box>
      )}
    </Box>
  )
}

const StyledLabel = styled.label<{ $extendedClickArea: boolean }>`
  cursor: pointer;
  user-select: none;

  &:before {
    --offset: 10px;

    content: '';
    display: ${({ $extendedClickArea }) => ($extendedClickArea ? 'block' : 'none')};
    position: absolute;
    top: calc(var(--offset) * -1);
    left: calc(var(--offset) * -1);
    width: calc(100% + var(--offset) * 2);
    height: calc(100% + var(--offset) * 2);
    background-color: ${({ theme }) => theme.colors.borderSecondary};
    border-radius: ${({ theme }) => theme.radii.tooltip}px;
    opacity: 0;
    transition: opacity 0.1s linear;
  }

  &:hover:before {
    opacity: 1;
  }
`

const StyledOutline = styled.span`
  display: none;
  pointer-events: none;
  position: absolute;
  top: -4px;
  right: -4px;
  bottom: -4px;
  left: -4px;
  width: auto;
  height: auto;
  margin: auto;
  border: 2px solid var(--fabric-color-focus);
  border-radius: 4px;
`

const StyledWrapper = styled(Flex)<{ $hasLabel: boolean }>`
  position: relative;

  &::before {
    content: '.';
    width: 0;
    visibility: hidden;
  }
`

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  align-self: center;
  margin: -20px 0;
  cursor: pointer;

  &:focus-visible + span {
    display: block;
  }
`
