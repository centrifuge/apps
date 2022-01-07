import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const TextLink = styled.span`
  color: inherit;
  text-decoration: underline;
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
      top: -2px;
      right: -6px;
      bottom: -2px;
      left: -6px;
      margin: auto;
      borderradius: 20px;
      boxshadow: 0 0 0 2px var(--fabric-color-focus);
      pointerevents: none;
    }
  }
`

export const RouterTextLink = TextLink.withComponent(Link)

export const AnchorTextLink: React.FC<React.ComponentPropsWithoutRef<'a'>> = (props) => {
  return <TextLink as="a" target="_blank" rel="noopener noreferrer" {...props} />
}
