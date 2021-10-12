import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

export const Container = styled(Box)({})

Container.defaultProps = {
  maxWidth: 'container',
  mx: 'auto',
}

export type ContainerProps = BoxProps
