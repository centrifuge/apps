import styled, { keyframes } from 'styled-components'
import { IconSpinner } from '../../icon'

const rotate = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
`

export const Spinner = styled(IconSpinner)`
  animation: ${rotate} 600ms linear infinite;
`
