import * as React from 'react'
import styled, { keyframes } from 'styled-components'

interface BaseProps {
  done: boolean
  maxWidth?: number
  width?: number
  alignRight?: boolean
  height?: number
}

interface PropsWithChildren extends BaseProps {
  children: React.ReactNode
}

interface PropsWithRender extends BaseProps {
  render: () => React.ReactNode
}

const loadingAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`

const Wrapper = styled.div<{ width?: number; verticalMargin?: number; height?: number; alignRight?: boolean }>`
  display: inline-block;
  vertical-align: middle;
  background: #eee;
  border-radius: 6px;
  width: ${(props) => (props.width ? `${props.width}px` : '80px')};
  height: ${(props) => (props.height ? `${props.height}px` : '17px')};
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-image: linear-gradient(to right, transparent 0%, #ddd 50%, transparent 100%);
    animation: ${loadingAnimation} 1s ease infinite;
  }
`

export const LoadingValue = (props: PropsWithChildren | PropsWithRender) => {
  const [width, setWidth] = React.useState(randomWidth(props.maxWidth))

  React.useEffect(() => {
    !props.done && setWidth(randomWidth(props.maxWidth))
  }, [props.done])

  return props.done ? (
    <>{isPropsWithRender(props) ? props.render() : props.children}</>
  ) : (
    <Wrapper
      width={props.width || width}
      height={props.height}
      alignRight={props.alignRight === undefined ? true : props.alignRight}
    >
      &nbsp;
    </Wrapper>
  )
}

const randomWidth = (max: number = 120) => {
  return Math.round(max / 2 + Math.random() * (max / 2))
}

function isPropsWithRender(props: PropsWithChildren | PropsWithRender): props is PropsWithRender {
  return (props as PropsWithRender).render !== undefined
}
