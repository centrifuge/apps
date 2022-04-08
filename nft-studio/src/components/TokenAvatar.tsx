import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { css } from 'styled-components'

type TokenAvatarProps = {
  label: string
  size: 'small' | 'large'
}

export const TokenAvatar: React.VFC<TokenAvatarProps> = ({ label, ...props }) => {
  return (
    <StyledAvatar {...props}>
      <div>{label.slice(0, 3)}</div>
      <div>{label.slice(3, 6)}</div>
    </StyledAvatar>
  )
}

const StyledAvatar = styled(Box)<Partial<TokenAvatarProps>>`
  background: ${({ theme }) => theme.colors.accentSecondary};
  border-radius: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
