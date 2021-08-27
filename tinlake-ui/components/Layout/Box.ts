import shouldForwardProp from '@styled-system/should-forward-prop'
import styled from 'styled-components'
import {
  background,
  BackgroundProps,
  border,
  BorderProps,
  color,
  ColorProps,
  compose,
  flexbox,
  FlexboxProps,
  grid,
  GridProps,
  layout,
  LayoutProps,
  position,
  PositionProps,
  space,
  SpaceProps,
  textAlign,
  TextAlignProps,
} from 'styled-system'

interface SystemProps
  extends SpaceProps,
    LayoutProps,
    BackgroundProps,
    ColorProps,
    FlexboxProps,
    GridProps,
    BorderProps,
    TextAlignProps,
    PositionProps {}

interface StyledBoxProps extends SystemProps {}

export const Box = styled('div').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledBoxProps>(compose(space, layout, background, color, flexbox, grid, border, textAlign, position))

export const Flex = styled(Box)`
  display: flex;
`
