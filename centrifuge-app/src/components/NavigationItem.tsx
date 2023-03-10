import { Box, Grid, IconChevronDown, IconChevronRight, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'

type Props = {
  label: React.ReactNode
  icon?: React.ReactElement
  href?: string
  defaultOpen?: boolean
  active?: boolean
  stacked?: boolean
  children?: React.ReactNode
}

const NavigationClickable = styled(Shelf)<{ $active?: boolean; stacked?: boolean }>`
  width: 100%;
  height: ${({ stacked }) => (stacked ? 'auto' : '32px')};
  padding-block: ${({ theme }) => theme.space[2]}px;
  padding-inline: ${({ theme }) => theme.space[1]}px;

  justify-content: space-between;
  align-items: center;

  cursor: pointer;
  background-color: ${({ $active, theme }) => ($active ? theme.colors.secondarySelectedBackground : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.textSelected : theme.colors.textPrimary)};
  border: none;

  @media (min-width: ${({ theme }) => theme.breakpoints['XL']}) {
    border-radius: 16px;
  }

  :hover {
    color: ${({ theme }) => theme.colors.textSelected};
  }

  :focus-visible {
    color: ${({ theme }) => theme.colors.textSelected};
    outline: solid ${({ theme }) => theme.colors.textSelected};
    outline-offset: -1px;
  }
`

const StyledLabel = styled(Grid)`
  > svg {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

export const StyledListItem = styled(Box)<{ stacked?: boolean }>``

export const NavigationItem: React.FC<Props> = ({ label, icon, href, children, active, stacked }) => {
  const match = useRouteMatch(href || '/ignore') || active

  return (
    <NavigationClickable
      as={href ? Link : 'button'}
      {...(href ? { to: href } : {})}
      $active={(!stacked || !children) && !!match}
      stacked={stacked}
    >
      <Label {...{ label, icon, stacked }} />
    </NavigationClickable>
  )
}

function Label({ label, icon, stacked }: Props) {
  return (
    <StyledLabel
      width="100%"
      alignItems="center"
      gap={1}
      gridTemplateColumns={stacked ? '1fr' : '16px 1fr'}
      gridTemplateRows={stacked ? '20px 1fr' : '1fr'}
      gridAutoFlow={stacked ? 'column' : 'row'}
      justifyItems={stacked ? 'center' : 'start'}
    >
      {!!icon && icon}
      <Text
        as="span"
        variant="interactive1"
        color="inherit"
        style={{ gridColumn: stacked ? 'unset' : 2 }}
        {...(stacked ? { fontSize: 10 } : {})}
      >
        {label}
      </Text>
    </StyledLabel>
  )
}

export function Collapsible({
  defaultOpen = false,
  children,
  stacked,
  ...rest
}: Props & { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const { space } = useTheme()
  const fullWidth = `calc(100vw - 2 * ${space[1]}px)`
  const offset = `calc(100% + 2 * ${space[1]}px)`
  const id = React.useId()

  return (
    <Box position={['static', 'static', 'relative', 'relative', 'static']} width="100%">
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
      <NavigationClickable
        as="button"
        id={`${id}-button`}
        aria-controls={`${id}-menu`}
        title={open ? 'Hide menu' : 'Show menu'}
        onClick={() => setOpen(!open)}
        stacked={stacked}
      >
        <Label {...rest} stacked={stacked} />
        {!stacked && (open ? <IconChevronDown /> : <IconChevronRight />)}
      </NavigationClickable>

      <Box
        as="section"
        hidden={!open}
        id={`${id}-menu`}
        aria-labelledby={`${id}-button`}
        aria-expanded={!!open}
        position={['absolute', 'absolute', 'absolute', 'absolute', 'static']}
        top={['auto', 'auto', 1, 1, 'auto']}
        bottom={[offset, offset, 'auto']}
        left={[1, 1, offset, offset, 'auto']}
        width={[fullWidth, fullWidth, 300, 300, '100%']}
      >
        {children}
      </Box>
    </Box>
  )
}
