import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

export const Container = styled(Box)({})

Container.defaultProps = {
  width: '100%',
  maxWidth: 'container',
  mx: 'auto',
}

export type ContainerProps = BoxProps
