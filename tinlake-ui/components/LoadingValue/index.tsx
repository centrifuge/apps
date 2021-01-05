import * as React from 'react'
import styled from 'styled-components'

interface LoadingValueProps {
  done: boolean
  children: React.ReactNode
  height?: number
  alignRight?: boolean
}

const Wrapper = styled.div<{ width?: number; verticalMargin?: number; alignRight?: boolean }>`
  background: #eee;
  border-radius: 6px;
  width: ${(props) => (props.width ? `${props.width}px` : '80px')};
  height: 17px;
  margin: ${(props) =>
    props.verticalMargin
      ? `${2 + props.verticalMargin}px 0 ${2 + props.verticalMargin}px ${props.alignRight ? 'auto' : '0'}`
      : `2px 0 2px ${props.alignRight ? 'auto' : '0'}`};
`

export const LoadingValue = (props: LoadingValueProps) => {
  const randomWidth = () => {
    return 60 + Math.round(Math.random() * 60)
  }

  const [width, setWidth] = React.useState(randomWidth())

  React.useEffect(() => {
    setWidth(randomWidth())
  }, [props.done])

  return props.done ? (
    <>{props.children}</>
  ) : (
    <Wrapper
      width={width}
      verticalMargin={((props.height || 21) - 21) / 2}
      alignRight={props.alignRight === undefined ? true : props.alignRight}
    >
      &nbsp;
    </Wrapper>
  )
}
