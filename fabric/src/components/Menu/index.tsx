import * as React from 'react'
import styled from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { Box } from '../Box'
import { Card, CardProps } from '../Card'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type MenuProps = Omit<CardProps, 'variant'>

export const Menu: React.FC<MenuProps> = ({ children, ...cardProps }) => {
  return (
    <Card {...cardProps} variant="overlay">
      <Stack>{children}</Stack>
    </Card>
  )
}

type IconProps = {
  size?: ResponsiveValue<string | number>
}

export type MenuItemProps = {
  label: string
  sublabel?: string
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
} & React.ComponentPropsWithoutRef<'button'>

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  sublabel,
  icon: IconComp,
  iconRight: IconRightComp,
  ...buttonProps
}) => {
  return (
    <MenuItemButton {...buttonProps}>
      <Shelf gap={1} px={2} py={1}>
        {IconComp && isComponent(IconComp) ? <IconComp size="iconMedium" /> : IconComp}
        <Stack alignItems="flex-start">
          <Text variant="interactive" color="currentcolor">
            {label}
          </Text>
          <Sublabel variant="label2">{sublabel}</Sublabel>
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
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.brand};
    color: ${({ theme }) => theme.colors.backgroundPrimary};

    ${Sublabel} {
      color: ${({ theme }) => theme.colors.backgroundPrimary};
    }
  }

  &:first-child {
    border-top-left-radius: ${({ theme }) => theme.radii.card}px;
    border-top-right-radius: ${({ theme }) => theme.radii.card}px;
  }

  &:last-child {
    border-bottom-left-radius: ${({ theme }) => theme.radii.card}px;
    border-bottom-right-radius: ${({ theme }) => theme.radii.card}px;
  }
`

function isComponent(object: any): object is React.ComponentType<any> {
  return typeof object === 'function'
}
