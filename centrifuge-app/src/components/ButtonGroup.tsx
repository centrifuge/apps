import { Shelf } from '@centrifuge/fabric'
import css from '@styled-system/css'
import styled from 'styled-components'

export const ButtonGroup = styled(Shelf)<{ variant?: 'large' | 'small' | 'toolbar' }>(({ variant }) =>
  css({
    columnGap: variant === 'large' ? 2 : variant === 'small' ? 1 : 0,
  })
)

ButtonGroup.defaultProps = {
  justifyContent: ['center', 'flex-start'],
  variant: 'small',
  rowGap: 1,
  flexWrap: 'wrap',
}
