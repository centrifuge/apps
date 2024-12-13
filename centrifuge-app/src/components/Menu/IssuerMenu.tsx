import { Box, IconChevronDown, IconChevronRight, IconUser, Menu as Panel, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useMatch } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Toggle } from './Toggle'

type IssuerMenuProps = {
  defaultOpen?: boolean
  stacked?: boolean
  children?: React.ReactNode
}

const StyledPanel = styled(Panel)`
  & > div {
    max-height: 50vh;
  }
`

export function IssuerMenu({ defaultOpen = false, children }: IssuerMenuProps) {
  const match = useMatch('/issuer/*')
  const isActive = !!match
  const [open, setOpen] = React.useState(defaultOpen)
  const { space } = useTheme()
  const fullWidth = `calc(100vw - 2 * ${space[1]}px)`
  const offset = `calc(100% + 2 * ${space[1]}px)`
  const id = React.useId()
  const isLarge = useIsAboveBreakpoint('L')
  const isMedium = useIsAboveBreakpoint('M')
  const theme = useTheme()

  React.useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  return (
    <Box position={['static', 'static', 'relative', 'relative', 'static']}>
      {open && (
        <Box
          display={['block', 'block', 'block', 'block', 'none']}
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
        stacked={!isLarge}
        isMedium={isMedium}
        isActive={isActive}
      >
        <IconUser size={['iconMedium', 'iconMedium', 'iconSmall']} />
        Issuer
        {isLarge &&
          (open ? (
            <IconChevronDown size={['iconMedium', 'iconMedium', 'iconSmall']} color="textInverted" />
          ) : (
            <IconChevronRight size={['iconMedium', 'iconMedium', 'iconSmall']} color="white" />
          ))}
      </Toggle>

      <Box
        as="section"
        hidden={!open}
        id={`${id}-menu`}
        aria-labelledby={`${id}-button`}
        aria-expanded={!!open}
        position={['absolute', 'absolute', 'absolute', 'relative', 'static']}
        top={['auto', 'auto', 0, 'auto']}
        bottom={[offset, offset, 'auto']}
        left={[1, 1, offset, 'auto', 'auto']}
        width={[fullWidth, fullWidth, 200, '100%']}
        mt={[0, 0, 0, 1]}
        zIndex={20}
      >
        {isLarge ? (
          <Stack as="ul" gap={1}>
            {children}
          </Stack>
        ) : (
          <StyledPanel backgroundColor={theme.colors.backgroundInverted}>{children}</StyledPanel>
        )}
      </Box>
    </Box>
  )
}
