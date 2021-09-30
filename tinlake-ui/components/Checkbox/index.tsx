import { CheckBox as GrommetCheckbox, CheckBoxExtendedProps } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { Flex, Shelf } from '../Layout'
import { Text } from '../Text'

interface Props extends CheckBoxExtendedProps {}

export const Checkbox: React.FC<Props> = ({ label, ...checkboxProps }) => {
  return (
    <label>
      <Shelf as={Text} gap="xsmall" alignItems="baseline">
        <CheckboxWrapper minWidth="24px" flex="0 0 24px">
          <GrommetCheckbox {...checkboxProps} />
        </CheckboxWrapper>
        <Text>{label}</Text>
      </Shelf>
    </label>
  )
}

const CheckboxWrapper = styled(Flex)`
  input {
    display: none;
  }

  > * {
    align-self: center;
    margin: -20px 0;
  }

  &::before {
    content: '.';
    width: 0;
    visibility: hidden;
  }
`
