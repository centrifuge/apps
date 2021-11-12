import { Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
	0% {
		transform: rotate(0);
	}

	100% {
		transform: rotate(1turn);
	}
`

const StyledSpinner = styled.div`
  width: 48px;
  height: 48px;
  border-width: 3px;
  border-style: solid;
  border-color: currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${rotate} 0.6s linear infinite;
`

export const Spinner: React.FC = () => {
  return (
    <Shelf justifyContent="center">
      <Text>
        <StyledSpinner />
      </Text>
    </Shelf>
  )
}
