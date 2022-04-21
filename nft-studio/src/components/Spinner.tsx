import { Shelf } from '@centrifuge/fabric'
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

const StyledSpinner = styled.div`
  width: 100%;
  height: 100%;
  border-width: max(0.0625em, 2px);
  border-style: solid;
  border-color: currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${rotate} 0.6s linear infinite;
`

export const Spinner: React.FC<{ size?: string | number }> = ({ size = '48px' }) => {
  const theme = useTheme()
  const sizePx = toPx(theme.sizes[size as ThemeSize] || size)
  return (
    <Shelf justifyContent="center" width={sizePx} height={sizePx} style={{ fontSize: sizePx }}>
      <StyledSpinner />
    </Shelf>
  )
}

function toPx(n: number | string) {
  return typeof n === 'number' ? `${n}px` : n
}
