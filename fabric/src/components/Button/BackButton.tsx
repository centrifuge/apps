import React, { ReactNode } from 'react'
import styled from 'styled-components'
import IconArrowLeft from '../../icon/IconArrowLeft'
import { Box } from '../Box'
import { Text } from '../Text'

const StyledRouterLinkButton = styled.button`
  border-radius: 50%;
  border: 4px solid transparent;
  width: 34px;
  height: 34px;

  > span {
    min-height: 28px;
  }

  &:hover {
    width: 34px;
    height: 34px;
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    span {
      color: ${({ theme }) => theme.colors.textPrimary};
    }
  }
`

export const BackButton = ({
  as,
  align = 'space-between',
  children,
  label,
  to,
  width = '55%',
  goBack,
  ...props
}: {
  align?: string
  as?: React.ElementType
  children?: ReactNode
  label: string
  to?: string
  width?: string
  goBack?: boolean
}) => {
  return (
    <Box display="flex" width={width} justifyContent={align}>
      <StyledRouterLinkButton
        as={as}
        to={to}
        small
        icon={<IconArrowLeft size={20} />}
        variant="tertiary"
        {...props}
        goBack={goBack}
      />
      <Box display="flex" alignItems="center">
        <Text variant="heading1" style={{ marginRight: 8 }}>
          {label}
        </Text>
        {children}
      </Box>
    </Box>
  )
}

export default BackButton
