import { Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { PropsOf } from '../../helpers'

const Pill = styled.button<{ variant?: 'small' | 'regular' }>(
  css({
    display: 'inline-block',
    appearance: 'none',
    color: 'textPrimary',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    backgroundColor: 'backgroundSecondary',
    textDecoration: 'none',
    borderRadius: 20,
    lineHeight: 20,
    '&:visited, &:active': {
      color: 'textPrimary',
    },
    '&:hover': {
      color: 'textInverted',
      backgroundColor: 'textPrimary',
    },
  }),
  ({ theme }) => ({
    border: `1px solid ${theme.colors.textPrimary}`,
    '&:focus-visible': {
      boxShadow: '3px 3px 0 var(--fabric-focus)',
    },
  }),
  ({ variant }) =>
    variant === 'regular'
      ? css({
          borderRadius: '20px',
          fontSize: '14px',
          padding: '8px 16px',
        })
      : css({
          borderRadius: '12px',
          padding: '4px 12px',
          fontSize: '12px',
        })
)

type PillProps = PropsOf<typeof Pill> & { variant?: 'small' | 'regular' }

export function PillButton({ children, variant = 'regular', ...rest }: PillProps) {
  return (
    <Pill {...rest} variant={variant}>
      <Text variant="interactive2" fontSize={variant === 'regular' ? '14px' : '12px'} color="inherit">
        {children}
      </Text>
    </Pill>
  )
}

export function AnchorPillButton(props: React.ComponentPropsWithoutRef<'a'> & { variant?: 'small' | 'regular' }) {
  return <PillButton as="a" target="_blank" rel="noopener noreferrer" {...props} />
}
