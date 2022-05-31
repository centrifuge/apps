import { Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { PropsOf } from '../../helpers'

const Pill = styled.button<{ variant?: 'small' | 'regular' }>(
  css({
    color: 'textPrimary',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    backgroundColor: 'backgroundSecondary',
    textDecoration: 'none',
    '&:visited,&:active': {
      color: 'textPrimary',
    },
    '&:hover': {
      color: 'textSelected',
    },
  }),
  {
    '&:focus-visible': {
      boxShadow: '3px 3px 0 var(--fabric-color-focus)',
    },
  },
  ({ variant }) =>
    variant === 'regular'
      ? css({
          borderRadius: '20px',
          fontSize: '14px',
          padding: '2px 8px',
        })
      : css({
          borderRadius: '12px',
          padding: '2px 10px',
          fontSize: '12px',
        })
)

type PillProps = PropsOf<typeof Pill> & { variant?: 'small' | 'regular' }

export const PillButton: React.FC<PillProps> = ({ children, variant = 'regular', ...rest }) => {
  return (
    <Pill {...rest} variant={variant}>
      <Text variant="interactive2" fontSize={variant === 'regular' ? '14px' : '12px'} color="inherit">
        {children}
      </Text>
    </Pill>
  )
}

export const AnchorPillButton: React.FC<React.ComponentPropsWithoutRef<'a'> & { variant?: 'small' | 'regular' }> = (
  props
) => {
  return <PillButton as="a" target="_blank" rel="noopener noreferrer" {...props} />
}
