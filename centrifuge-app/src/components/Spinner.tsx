import { Shelf, ShelfProps } from '@centrifuge/fabric'
import { ThemeSize } from '@centrifuge/fabric/dist/utils/types'
import * as React from 'react'
import styled, { keyframes, useTheme } from 'styled-components'

const rotate = keyframes`
	0% {
		transform: rotate(0);
	}

	100% {
		transform: rotate(1turn);
	}
`

const StyledSpinner = styled.div<{ $size: string }>`
  font-size: ${(props) => props.$size};
  width: 1em;
  height: 1em;
  border-width: max(0.0625em, 2px);
  border-style: solid;
  border-color: currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${rotate} 0.6s linear infinite;
`

type SpinnerProps = ShelfProps & {
  size?: string | number
}

export function Spinner({ size = '48px', ...shelfProps }: SpinnerProps) {
  const theme = useTheme()
  const sizePx = toPx(theme.sizes[size as ThemeSize] || size)

  return (
    <Shelf justifyContent="center" {...shelfProps}>
      <StyledSpinner $size={sizePx} />
    </Shelf>
  )
}

function toPx(n: number | string) {
  return typeof n === 'number' ? `${n}px` : n
}
