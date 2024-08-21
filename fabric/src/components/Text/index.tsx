import shouldForwardProp from '@styled-system/should-forward-prop'
import * as CSS from 'csstype'
import * as React from 'react'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import {
  ColorProps,
  ResponsiveValue,
  SpaceProps,
  TypographyProps as TypographySystemProps,
  color,
  compose,
  space,
  system,
  typography as typographySystem,
} from 'styled-system'

interface TypographyProps {
  textTransform?: ResponsiveValue<CSS.Property.TextTransform>
  whiteSpace?: ResponsiveValue<CSS.Property.WhiteSpace>
  textDecoration?: ResponsiveValue<CSS.Property.TextDecoration>
}

const typography = system({
  textTransform: {
    property: 'textTransform',
  },
  whiteSpace: {
    property: 'whiteSpace',
  },
  textDecoration: {
    property: 'textDecoration',
  },
})

interface SystemProps extends TypographySystemProps, ColorProps, SpaceProps, TypographyProps {}

interface StyledTextProps extends SystemProps {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
}

const StyledText = styled('span').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledTextProps>({ margin: 0 }, compose(typographySystem, typography, color, space))

const TextContext = React.createContext(false)

function useTextContext(): React.ContextType<typeof TextContext> {
  return React.useContext(TextContext)
}

type AnchorProps = React.ComponentPropsWithoutRef<'a'>

interface TextProps extends StyledTextProps, Omit<AnchorProps, keyof StyledTextProps> {
  variant?: keyof DefaultTheme['typography']
  textOverflow?: 'ellipsis'
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  children?: React.ReactNode
  htmlFor?: string
}

const Text = React.forwardRef<HTMLDivElement | HTMLSpanElement | HTMLAnchorElement, TextProps>((props, ref) => {
  const isInText = useTextContext()
  const theme = useTheme()

  let textProps = props
  if (props.variant) {
    textProps = { ...theme.typography[props.variant], ...props }
  }

  const {
    children,
    as = isInText ? 'span' : 'div',
    color = isInText ? 'inherit' : 'textPrimary',
    fontSize = isInText ? 'inherit' : '1rem',
    fontWeight = isInText ? 'inherit' : 400,
    lineHeight = isInText ? 'inherit' : 1.5,
    fontFamily = isInText ? 'inherit' : 'standard',
    margin,
    ...rest
  } = textProps

  const overflow = props.textOverflow ? { overflow: 'hidden', textOverflow: props.textOverflow } : {}

  return (
    <TextContext.Provider value>
      <StyledText
        as={as}
        ref={ref as React.Ref<HTMLDivElement | HTMLSpanElement | HTMLAnchorElement>}
        color={color}
        fontSize={fontSize}
        fontWeight={fontWeight}
        lineHeight={lineHeight}
        fontFamily={fontFamily}
        style={{ ...overflow }}
        {...rest}
      >
        {children}
      </StyledText>
    </TextContext.Provider>
  )
})

export { Text, TextContext, TextProps, useTextContext }
