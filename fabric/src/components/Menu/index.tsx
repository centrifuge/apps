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

export const Menu: React.FC<MenuProps> = ({ children, ...cardProps }) => {
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

export const MenuItemGroup: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <>
      <MenuDivider borderColor="borderSecondary" />
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
} & PropsOf<typeof MenuItemButton>

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  sublabel,
  icon: IconComp,
  iconRight: IconRightComp,
  ...buttonProps
}) => {
  return (
    <MenuItemButton {...buttonProps}>
      <Shelf gap={1} px={2} py={1} minHeight="48px">
        {IconComp && isComponent(IconComp) ? <IconComp size="iconMedium" /> : IconComp}
        <Stack alignItems="flex-start">
          <Text variant="interactive1" color="inherit">
            {label}
          </Text>
          <Sublabel variant="label3" color="inherit">
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
    background-color: ${({ theme }) => theme.colors.accentPrimary};
    color: ${({ theme }) => theme.colors.textInverted};
    * {
      color: ${({ theme }) => theme.colors.textInverted};
    }
  }
`

function isComponent(object: any): object is React.ComponentType<any> {
  return typeof object === 'function'
}
