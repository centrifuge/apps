import * as React from 'react'
import styled from 'styled-components'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

type RadioButtonProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export const RadioButton: React.VFC<RadioButtonProps> = ({ label, ...radioProps }) => {
  return (
    <label>
      <Shelf as={Text} gap={1} alignItems="baseline">
        <StyledWrapper minWidth="20px" height="20px" flex="0 0 20px">
          <StyledRadioButton type="radio" {...radioProps} />
          <StyledOutline />
        </StyledWrapper>
        <Text variant="body1" color={radioProps.disabled ? 'textDisabled' : 'textPrimary'}>
          {label}
        </Text>
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
  top: 1px;

  &::before {
    content: '.';
    width: 0;
    visibility: hidden;
  }
`

const StyledRadioButton = styled.input`
  width: 20px;
  height: 20px;
  align-self: center;
  margin: -20px 0;

  &:focus-visible + span {
    display: block;
  }
`
