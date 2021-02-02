import * as React from 'react'
import styled from 'styled-components'

interface Props<T> {
  value: T | undefined | null
  children: (v: T) => React.ReactNode
  maxWidth?: number
  alignRight?: boolean
  height?: number
}

const Wrapper = styled.div<{ width?: number; verticalMargin?: number; alignRight?: boolean }>`
  display: inline-block;
  vertical-align: middle;
  background: #eee;
  border-radius: 6px;
  width: ${(props) => (props.width ? `${props.width}px` : '80px')};
  height: 17px;
  margin: ${(props) =>
    props.verticalMargin
      ? `${2 + props.verticalMargin}px 0 ${2 + props.verticalMargin}px ${props.alignRight ? 'auto' : '0'}`
      : `2px 0 2px ${props.alignRight ? 'auto' : '0'}`};
`

export const LoadingValue = <T,>({ value, children, maxWidth, alignRight, height }: Props<T>) => {
  const [width, setWidth] = React.useState(randomWidth(maxWidth))

  React.useEffect(() => {
    !value && setWidth(randomWidth(maxWidth))
  }, [value])

  return value ? (
    <>{children(value)}</>
  ) : (
    <Wrapper
      width={width}
      verticalMargin={((height || 21) - 21) / 2}
      alignRight={alignRight === undefined ? true : alignRight}
    >
      &nbsp;
    </Wrapper>
  )
}

const randomWidth = (max: number = 120) => {
  return Math.round(max / 2 + Math.random() * (max / 2))
}
