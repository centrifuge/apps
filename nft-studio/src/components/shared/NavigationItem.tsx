import { Box, Button, IconChevronDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import React, { useState } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'

type Props = {
  label: string
  icon?: React.ReactElement
  href?: string
  defaultOpen?: boolean
}

const NavigationClickable = styled(Shelf)<{ $active?: boolean }>`
  cursor: pointer;
  background: ${({ $active, theme }) => $active && theme.colors.backgroundSecondary};
  :hover {
    color: ${({ theme }) => theme.colors.brand};
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
  const isDesktop = useIsAboveBreakpoint('M')

  return (
    <>
      {isDesktop ? (
        <>
          <NavigationClickable
            paddingLeft={1}
            paddingRight={1}
            borderRadius={4}
            height={32}
            justifyContent="space-between"
            alignItems="center"
            onClick={() => {
              if (children) setOpen(!open)
              else if (href) history.push(href)
            }}
            $active={(!isDesktop || !children) && !!match}
          >
            <Shelf alignItems="center">
              <IconWrapper>{icon}</IconWrapper>
              {isDesktop && (
                <Text variant="interactive1" color="inherit">
                  {label}
                </Text>
              )}
            </Shelf>

            <Box>{children && isDesktop && (open ? <IconChevronDown /> : <IconChevronRight />)}</Box>
          </NavigationClickable>
          <Box>{open && isDesktop && children}</Box>
        </>
      ) : (
        <Button
          onClick={() => {
            if (href) history.push(href)
          }}
          variant="text"
          icon={icon}
        />
      )}
    </>
  )
}
