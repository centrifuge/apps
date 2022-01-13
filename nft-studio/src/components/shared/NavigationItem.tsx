import { Box, IconChevronDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import styled from 'styled-components'

type Props = {
  label: string
  icon?: React.ReactNode
  href?: string
  defaultOpen?: boolean
}

const NavigationClickable = styled(Shelf)<{ $active?: boolean }>`
  cursor: pointer;
  background: ${({ $active, theme }) => $active && theme.colors.backgroundSecondary};
  :hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`

const IconWrapper = styled(Shelf)`
  width: 24px;
  & svg {
    vertical-align: baseline;
  }
`
export const NavigationItem: React.FC<Props> = ({ label, icon, href, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  const history = useHistory()
  const match = useRouteMatch(href || '/ignore')

  return (
    <Box>
      <NavigationClickable
        paddingLeft={1}
        paddingRight={1}
        borderRadius={4}
        height={32}
        justifyContent="space-between"
        alignItems="center"
        onClick={() => {
          if (children) setOpen(!open)
          if (href) history.push(href)
        }}
        $active={!!match}
      >
        <Shelf alignItems="center">
          <IconWrapper>{icon}</IconWrapper>
          <Text variant="interactive1">{label}</Text>
        </Shelf>

        <Box>{children && (open ? <IconChevronDown /> : <IconChevronRight />)}</Box>
      </NavigationClickable>
      <Box>{open && children}</Box>
    </Box>
  )
}
