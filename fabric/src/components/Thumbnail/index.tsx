import * as React from 'react'
import styled, { css } from 'styled-components'
import { Stack } from '../Stack'
import { Text } from '../Text'

type ThumbnailProps = {
  label: string
  type?: 'token' | 'pool' | 'asset'
  size?: 'small' | 'large'
}

export const Thumbnail: React.VFC<ThumbnailProps> = ({ label, ...props }) => {
  return (
    <StyledThumbnail fontWeight={500} {...props}>
      <Stack position="relative" zIndex="1">
        <span>{label.slice(0, 3)}</span>
        <span>{label.slice(3, 6)}</span>
      </Stack>
    </StyledThumbnail>
  )
}

const StyledThumbnail = styled(Text)<Partial<ThumbnailProps>>`
  background: ${({ theme, type }) => (type === 'asset' ? 'transparent' : theme.colors.accentSecondary)};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  text-align: center;
  ${({ type, theme }) => {
    switch (type) {
      case 'pool':
        return css({
          borderRadius: '4px',
        })
      case 'asset':
        return css({
          '&::before': {
            content: '""',
            width: '80%',
            height: '80%',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            margin: 'auto',
            zIndex: 'base',
            transform: 'rotate(45deg)',
            background: theme.colors.accentSecondary,
            borderRadius: '4px',
          },
        })
      case 'token':
      default:
        return css({
          borderRadius: '100%',
        })
    }
  }};
  ${({ size, theme }) => {
    switch (size) {
      case 'large':
        return css({
          lineHeight: '0.9',
          fontSize: '14px',
          height: theme.sizes.iconLarge,
          width: theme.sizes.iconLarge,
        })
      case 'small':
      default:
        return css({
          lineHeight: '1',
          fontSize: '8px',
          height: theme.sizes.iconMedium,
          width: theme.sizes.iconMedium,
        })
    }
  }}
`
