import shouldForwardProp from '@styled-system/should-forward-prop'
import * as React from 'react'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import { color, ColorProps, compose, typography, TypographyProps } from 'styled-system'
import { PropsOf } from '../../utils/types'

interface SystemProps extends TypographyProps, ColorProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StyledTextProps extends SystemProps {}

const StyledText = styled('span').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledTextProps>({ margin: 0 }, compose(typography, color))

const TextContext = React.createContext(false)

function useTextContext(): React.ContextType<typeof TextContext> {
  return React.useContext(TextContext)
}

type TextProps = PropsOf<typeof StyledText> & { variant?: keyof DefaultTheme['typography'] }

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

  return (
    <TextContext.Provider value>
      <StyledText
        as={as}
        color={color}
        fontSize={fontSize}
        fontWeight={fontWeight}
        lineHeight={lineHeight}
        fontFamily={fontFamily}
        {...rest}
      >
        {children}
      </StyledText>
    </TextContext.Provider>
  )
}

export { Text, TextProps, useTextContext }
