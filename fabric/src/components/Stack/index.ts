import css from '@styled-system/css'
import * as CSS from 'csstype'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { Flex, FlexProps } from '../Flex'

type StyledStackProps = {
  gap?: ResponsiveValue<CSS.Property.RowGap<TLengthStyledSystem>>
}

export const Stack = styled(Flex)<StyledStackProps>((props) =>
  css({
    gap: props.gap,
  })
)

Stack.defaultProps = {
  flexDirection: 'column',
}

export type StackProps = FlexProps & StyledStackProps
