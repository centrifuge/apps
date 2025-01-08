import { Box, IconArrowLeft, Text } from '@centrifuge/fabric'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { RouterLinkButton } from './RouterLinkButton'

const StyledRouterLinkButton = styled(RouterLinkButton)`
  margin-left: 14px;
  border-radius: 50%;
  margin: 0px;
  padding: 0px;
  width: fit-content;
  margin-left: 30px;
  border: 4px solid transparent;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;

  > span {
    width: 34px;
    border: 4px solid transparent;
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    span {
      color: ${({ theme }) => theme.colors.textPrimary};
    }
  }
`

export const BackButton = ({
  to,
  children,
  label,
  align,
}: {
  to: string
  children?: ReactNode
  label: string
  align?: string
}) => {
  return (
    <Box display="flex" alignItems="center" width="55%" justifyContent={align || 'space-between'} mt={15} mb={24}>
      <StyledRouterLinkButton to={to} small icon={<IconArrowLeft />} variant="tertiary" />
      <Box display="flex" alignItems="center">
        <Text variant="heading1" style={{ marginRight: 8 }}>
          {label}
        </Text>
        {children}
      </Box>
    </Box>
  )
}
