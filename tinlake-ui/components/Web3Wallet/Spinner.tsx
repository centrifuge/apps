import * as React from 'react'
import styled from 'styled-components'

interface Props {
  color: string
}

const Wrapper = styled.div<Props>`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-color: ${(props: Props) => props.color || 'rgba(255, 255, 255, 0.3)'};
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  -webkit-animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`

export const Spinner: React.FC<Props> = (props: Props) => {
  return <Wrapper color={props.color}>&nbsp;</Wrapper>
}
