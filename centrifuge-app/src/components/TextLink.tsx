import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const TextLink = styled.span`
  position: relative;
  color: inherit;
  text-decoration: underline;
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  &:hover {
    text-decoration: none;
  }
  &:visited,
  &:active {
    color: inherit;
  }
  &:focus-visible {
    text-decoration: none;
    &::before {
      content: '';
      display: block;
      position: absolute;
      bottom: -1px;
      width: 100%;
      height: 2px;
      background-color: var(--fabric-focus);
      pointer-events: none;
    }
  }
`

export const RouterTextLink = TextLink.withComponent(Link)

export const ButtonTextLink = TextLink.withComponent('button')
ButtonTextLink.defaultProps = {
  type: 'button',
}

export const AnchorTextLink: React.FC<React.ComponentPropsWithoutRef<'a'>> = (props) => {
  return <TextLink as="a" target="_blank" rel="noopener noreferrer" {...props} />
}
