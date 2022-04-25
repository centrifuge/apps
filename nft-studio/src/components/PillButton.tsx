import { Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { PropsOf } from '../../helpers'

const Pill = styled.button(
  css({
    color: 'textPrimary',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    backgroundColor: 'backgroundSecondary',
    '&:visited,&:active': {
      color: 'textPrimary',
    },
    '&:hover': {
      color: 'accentPrimary',
    },
  }),
  {
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '20px',
    '&:focus-visible': {
      boxShadow: '3px 3px 0 var(--fabric-color-focus)',
    },
  }
)

type PillProps = PropsOf<typeof Pill>

export const PillButton: React.FC<PillProps> = ({ children, ...rest }) => {
  return (
    <Pill {...rest}>
      <Text variant="label1" color="inherit">
        {children}
      </Text>
    </Pill>
  )
}

export const AnchorPillButton: React.FC<React.ComponentPropsWithoutRef<'a'>> = (props) => {
  return <PillButton as="a" target="_blank" rel="noopener noreferrer" {...props} />
}
