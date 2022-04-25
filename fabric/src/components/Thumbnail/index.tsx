import * as React from 'react'
import styled, { css } from 'styled-components'
import { Text } from '../Text'

type ThumbnailProps = {
  label: string
  type?: 'token' | 'pool'
  size?: 'small' | 'large'
}

export const Thumbnail: React.VFC<ThumbnailProps> = ({ label, ...props }) => {
  return (
    <StyledThumbnail variant="body2" {...props}>
      <div>{label.slice(0, 3)}</div>
      <div>{label.slice(3, 6)}</div>
    </StyledThumbnail>
  )
}

const StyledThumbnail = styled(Text)<Partial<ThumbnailProps>>`
  background: ${({ theme }) => theme.colors.accentSecondary};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  ${({ type }) => {
    switch (type) {
      case 'pool':
        return css({
          borderRadius: '4px',
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
          fontSize: '12px',
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
