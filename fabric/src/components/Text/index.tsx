import shouldForwardProp from '@styled-system/should-forward-prop'
import * as CSS from 'csstype'
import * as React from 'react'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import {
  color,
  ColorProps,
  compose,
  ResponsiveValue,
  system,
  typography as typographySystem,
  TypographyProps as TypographySystemProps,
} from 'styled-system'
import { PropsOf } from '../../utils/types'

interface TypographyProps {
  textTransform?: ResponsiveValue<CSS.Property.TextTransform>
  whiteSpace?: ResponsiveValue<CSS.Property.WhiteSpace>
}

const typography = system({
  textTransform: {
    property: 'textTransform',
  },
  whiteSpace: {
    property: 'whiteSpace',
  },
})

interface SystemProps extends TypographySystemProps, ColorProps, TypographyProps {}

interface StyledTextProps extends SystemProps {}

const StyledText = styled('span').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledTextProps>({ margin: 0 }, compose(typographySystem, typography, color))

const TextContext = React.createContext(false)

function useTextContext(): React.ContextType<typeof TextContext> {
  return React.useContext(TextContext)
}

type TextProps = PropsOf<typeof StyledText> & {
  variant?: keyof DefaultTheme['typography']
  underline?: boolean
  textOverflow?: 'ellipsis'
}

const Text: React.FC<TextProps> = (props) => {
  const isInText = useTextContext()
  const theme = useTheme()

  let textProps = props
  if (props.variant) {
    textProps = { ...theme.typography[props.variant], ...props }
  }

  const {
    // variant,
    children,
    as = isInText ? 'span' : 'div',
    color = isInText ? 'inherit' : 'textPrimary',
    fontSize = isInText ? 'inherit' : '1rem',
    fontWeight = isInText ? 'inherit' : 400,
    lineHeight = isInText ? 'inherit' : 1.5,
    fontFamily = isInText ? 'inherit' : 'standard',
    ...rest
  } = textProps

  const textDecoration = props.underline ? 'underline' : 'initial'
  const overflow = props.textOverflow ? { overflow: 'hidden', textOverflow: props.textOverflow } : {}

  return (
    <TextContext.Provider value>
      <StyledText
        as={as}
        color={color}
        fontSize={fontSize}
        fontWeight={fontWeight}
        lineHeight={lineHeight}
        fontFamily={fontFamily}
        style={{ textDecoration, ...overflow }}
        {...rest}
      >
        {children}
      </StyledText>
    </TextContext.Provider>
  )
}

export { Text, TextProps, useTextContext, TextContext }
