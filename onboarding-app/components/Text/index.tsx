import shouldForwardProp from '@styled-system/should-forward-prop'
import * as React from 'react'
import styled from 'styled-components'
import { color, ColorProps, compose, typography, TypographyProps } from 'styled-system'
import { PropsOf } from '../../helpers'

interface SystemProps extends TypographyProps, ColorProps {}

interface StyledTextProps extends SystemProps {}

const StyledText = styled('div').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledTextProps>({ margin: 0 }, compose(typography, color))

const TextContext = React.createContext(false)

function useTextContext() {
  return React.useContext(TextContext)
}

type TextProps = PropsOf<typeof StyledText>

const Text: React.FC<TextProps> = (props) => {
  const isInText = useTextContext()
  const {
    children,
    as = isInText ? 'span' : 'div',
    color = isInText ? 'inherit' : 'black',
    fontSize = isInText ? 'inherit' : '1rem',
    fontWeight = isInText ? 'inherit' : 400,
    lineHeight = isInText ? 'inherit' : 1.5,
    ...rest
  } = props

  return (
    <TextContext.Provider value>
      <StyledText as={as} color={color} fontSize={fontSize} fontWeight={fontWeight} lineHeight={lineHeight} {...rest}>
        {children}
      </StyledText>
    </TextContext.Provider>
  )
}

const Heading: React.FC<TextProps> = ({ as = 'h1', lineHeight = 1.2, fontWeight = 600, ...rest }) => {
  return <Text as={as} lineHeight={lineHeight} fontWeight={fontWeight} {...rest} />
}

export { Text, Heading, useTextContext }
