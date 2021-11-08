import { Box, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import { Divider } from './Divider'

export const Menu: React.FC = ({ children }) => {
  return (
    <Card variant="overlay">
      <Stack>
        {React.Children.map(children, (child, i) => (
          <>
            {i > 0 && <Divider />}
            {child}
          </>
        ))}
      </Stack>
    </Card>
  )
}

type IconProps = {
  size?: ResponsiveValue<string | number>
}

type MenuItemProps = {
  label: string
  sublabel?: string
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
}

export const MenuItem: React.FC<MenuItemProps & React.ComponentPropsWithoutRef<'button'>> = ({
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
