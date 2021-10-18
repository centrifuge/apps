import styled from 'styled-components'
import { color, layout, space } from 'styled-system'
import { FabricTheme } from '../../theme'

const buttonColor =
  (colorName: string) =>
  ({ contained, outlined, text, theme }: Props) =>
    contained || !(contained || outlined || text)
      ? `
background: ${theme.colors[colorName]};
border-color: ${theme.colors[colorName]};
color: ${theme.colors.backgroundPrimary};
`
      : outlined
      ? `
color: ${theme.colors[colorName]};
border-color: ${theme.colors[colorName]};
`
      : // text
        `
color: ${theme.colors[colorName]};
`

export const Button = styled.button<Props>`
  display: inline-block;
  box-sizing: border-box;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  margin: 0px;
  text-transform: none;
  padding: 6px 16px;
  border-radius: 40px;
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: 100ms;
  transition-timing-function: ease-in-out;
  font-weight: 500;
  font-family: AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  font-size: 16px;
  line-height: 24px;
  text-align: center;

  background: transparent;
  border: 1px solid transparent;

  ${({ small }) =>
    small &&
    `
    font-size: 14px;
    line-height: 20px;
  `}

  ${buttonColor('textPrimary')}

  :hover, :active {
    ${buttonColor('brand')}
  }

  :disabled {
    cursor: not-allowed;
    ${buttonColor('textDisabled')}
  }

  :focus {
    ${({ contained, outlined, text, theme }) =>
      (contained || outlined || !(contained || outlined || text)) &&
      `
      box-shadow: ${theme.shadows.buttonFocused};
      `}
  }

  ${space}
  ${layout}
  ${color}
`

type Props = {
  theme: FabricTheme
  contained?: boolean
  outlined?: boolean
  text?: boolean
  small?: boolean
}
