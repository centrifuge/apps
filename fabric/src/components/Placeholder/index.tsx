import styled, { keyframes } from 'styled-components'
import { Box } from '../Box'

const load = keyframes`
from {
	background-position-x: 0;
}
to {
	background-position-x: -200%;
}
`

export const Placeholder = styled(Box)`
  --color1: ${({ theme }) => theme.colors.borderPrimary};
  --color2: ${({ theme }) => theme.colors.borderSecondary};
  background: linear-gradient(90deg, var(--color1), var(--color2), var(--color1));
  background-size: 200% 100%;
  background-position-y: 50%;
  background-repeat: repeat-x;
  animation: ${load} 1.5s ease infinite;
`
