import * as React from 'react'
import styled from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { PropsOf } from '../../utils/types'
import { Box } from '../Box'
import { Card, CardProps } from '../Card'
import { Divider } from '../Divider'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type MenuProps = Omit<CardProps, 'variant'>

export function Menu({ children, ...cardProps }: MenuProps) {
  return (
    <Card {...cardProps} variant="overlay">
      <ScrollContainer borderRadius="card">{children}</ScrollContainer>
    </Card>
  )
}

const ScrollContainer = styled(Stack)`
  overflow-y: auto;
  max-height: 80vh;
  @media (pointer: fine) {
    overscroll-behavior: none;
  }
`

export function MenuItemGroup({ children, hideDivider = false }: { children: React.ReactNode; hideDivider?: boolean }) {
  return (
    <>
      {hideDivider ? null : <MenuDivider borderColor="borderPrimary" />}
      {children}
    </>
  )
}

const MenuDivider = styled(Divider)`
  &:first-child {
    display: none;
  }
`

type IconProps = {
  size?: ResponsiveValue<string | number>
}

export type MenuItemProps = {
  label: React.ReactNode
  sublabel?: string
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
  minHeight?: string | number
} & PropsOf<typeof MenuItemButton> &
  React.HTMLAttributes<HTMLButtonElement>

export function MenuItem({
  label,
  sublabel,
  icon: IconComp,
  iconRight: IconRightComp,
  minHeight = '48px',
  ...buttonProps
}: MenuItemProps) {
  return (
    <MenuItemButton {...buttonProps}>
      <Shelf gap={1} px={2} py={1} minHeight={minHeight}>
        {IconComp && isComponent(IconComp) ? <IconComp size="iconMedium" /> : IconComp}
        <Stack alignItems="flex-start">
          <Text variant="interactive1" color="inherit">
            {label}
          </Text>
          <Sublabel variant="label2" color="inherit">
            {sublabel}
          </Sublabel>
        </Stack>
        <Box ml="auto" display="flex">
          {IconRightComp && (isComponent(IconRightComp) ? <IconRightComp size="iconSmall" /> : IconRightComp)}
        </Box>
      </Shelf>
    </MenuItemButton>
  )
}

const Sublabel = styled(Text)``

const MenuItemButton = styled.button`
  cursor: pointer;
  padding: 0;
  border: none;
  appearance: none;
  background: transparent;
  outline: 0;
  text-align: left;
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  &:focus-visible {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`

function isComponent(object: any): object is React.ComponentType<any> {
  return typeof object === 'function'
}
