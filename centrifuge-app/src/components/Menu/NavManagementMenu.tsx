import { Box, IconChevronDown, IconChevronRight, IconMonitor, Menu, MenuItemGroup, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import { usePoolsForWhichAccountIsFeeder } from '../../utils/usePoolsForWhichAccountIsFeeder'
import { PoolLink } from './PoolLink'
import { Toggle } from './Toggle'

type NavManagementMenuProps = {
  stacked?: boolean
}
// TODO: deduplicate some code between this and the IssuerMenu
export function NavManagementMenu({ stacked }: NavManagementMenuProps) {
  const match = useRouteMatch<{ pid: string }>('/nav-management/:pid')
  const isActive = !!match
  const [open, setOpen] = React.useState(isActive)
  const { space } = useTheme()
  const fullWidth = `calc(100vw - 2 * ${space[1]}px)`
  const offset = `calc(100% + 2 * ${space[1]}px)`
  const id = React.useId()
  const allowedPools = usePoolsForWhichAccountIsFeeder()

  return (
    allowedPools &&
    allowedPools?.length >= 1 && (
      <Box position={['static', 'static', 'relative', 'static']}>
        {open && (
          <Box
            display={['block', 'block', 'block', 'none']}
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="100%"
            onClick={() => setOpen(false)}
          />
        )}

        <Toggle
          forwardedAs="button"
          variant="interactive1"
          id={`${id}-button`}
          aria-controls={`${id}-menu`}
          aria-label={open ? 'Hide menu' : 'Show menu'}
          onClick={() => setOpen(!open)}
          isActive={isActive}
          stacked={stacked}
        >
          <IconMonitor size={['iconMedium', 'iconMedium', 'iconSmall']} />
          NAV management
          {!stacked && (open ? <IconChevronDown size="iconSmall" /> : <IconChevronRight size="iconSmall" />)}
        </Toggle>

        <Box
          as="section"
          hidden={!open}
          id={`${id}-menu`}
          aria-labelledby={`${id}-button`}
          aria-expanded={!!open}
          position={['absolute', 'absolute', 'absolute', 'static']}
          top={['auto', 'auto', 0, 0, 'auto']}
          bottom={[offset, offset, 'auto']}
          left={[1, 1, offset, offset, 'auto']}
          width={[fullWidth, fullWidth, 150, '100%']}
          mt={[0, 0, 0, 1]}
        >
          {!stacked ? (
            <Stack as="ul" gap={1}>
              {allowedPools.map((pool) => (
                <Box key={pool.id} as="li" pl={4}>
                  <PoolLink path="nav-management" pool={pool} />
                </Box>
              ))}
            </Stack>
          ) : (
            <Menu>
              {allowedPools.map((pool) => (
                <MenuItemGroup key={pool.id}>
                  <Box px={2} py={1}>
                    <PoolLink pool={pool} />
                  </Box>
                </MenuItemGroup>
              ))}
            </Menu>
          )}
        </Box>
      </Box>
    )
  )
}
