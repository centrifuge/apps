import styled from 'styled-components'
import { color, layout, space } from 'styled-system'

export const Button = styled.button`
  display: inline-block;
  box-sizing: border-box;
  cursor: pointer;
  font-style: inherit;
  font-variant: inherit;
  font-stretch: inherit;
  text-decoration: none;
  margin: 0px;
  background: rgb(0, 0, 0);
  overflow: visible;
  text-transform: none;
  border: 1px solid rgb(0, 0, 0);
  padding: 7px 31px;
  color: rgb(255, 255, 255);
  border-radius: 40px;
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: 0.1s;
  transition-timing-function: ease-in-out;
  font-weight: 500;
  font-family: AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  ${space}
  ${layout}
    ${color}
`
