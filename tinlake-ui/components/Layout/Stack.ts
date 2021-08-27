import css from '@styled-system/css'
import * as CSS from 'csstype'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { Flex } from './Box'

type StyledStackProps = {
  gap?: ResponsiveValue<CSS.Property.RowGap<TLengthStyledSystem>>
}

export const Stack = styled(Flex)<StyledStackProps>((props) =>
  css({
    rowGap: props.gap,
  })
)

Stack.defaultProps = {
  flexDirection: 'column',
}
