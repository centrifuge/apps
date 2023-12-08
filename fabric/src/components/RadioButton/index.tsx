import * as React from 'react'
import styled from 'styled-components'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type RadioButtonProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  errorMessage?: string
  textStyle?: string
}

export const RadioButton: React.VFC<RadioButtonProps> = ({ label, errorMessage, textStyle, ...radioProps }) => {
  return (
    <label>
      <Shelf as={Text} gap={1} alignItems="baseline">
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
  border: 2px solid var(--fabric-color-focus);
  border-radius: 20px;
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

  &:focus-visible + span {
    display: block;
  }
`
