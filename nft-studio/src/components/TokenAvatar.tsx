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
  ${({ size }) => {
    switch (size) {
      case 'large':
        return css({
          lineHeight: '0.9',
          fontSize: '12px',
          height: '40px',
          width: '40px',
        })
      case 'small':
      default:
        return css({
          lineHeight: '1',
          fontSize: '8px',
          height: '24px',
          width: '24px',
        })
    }
  }}
`
