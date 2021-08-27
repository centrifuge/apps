import styled from 'styled-components'
import { Flex } from './Box'

export const Center = styled(Flex)({})

Center.defaultProps = {
  alignItems: 'center',
  justifyContent: 'center',
}
