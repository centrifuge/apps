import { Box, IconChevronDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'

type Props = {
  label: string
  icon?: React.ReactNode
  href?: string
}

const NavigationClickable = styled(Shelf)`
  cursor: pointer;
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
export const NavigationItem: React.FC<Props> = ({ label, icon, href, children }) => {
  const [open, setOpen] = useState<boolean>()
  const history = useHistory()

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
      >
        <Shelf alignItems="center">
          <IconWrapper>{icon}</IconWrapper>
          <Text variant="interactive">{label}</Text>
        </Shelf>

        <Box>{children && (open ? <IconChevronDown /> : <IconChevronRight />)}</Box>
      </NavigationClickable>
      <Box>{open && children}</Box>
    </Box>
  )
}
