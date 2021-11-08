import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { ResponsiveValue } from 'styled-system'

type Props = {
  children: ({ menuTriggerProps }: any) => React.ReactNode
}

export const PopoverMenu: React.FC<Props> = ({}) => {
  return <div />
}

export const OverlayMenu: React.FC = ({ children }) => {
  return <Card variant="overlay">{children}</Card>
}

type IconProps = {
  size?: ResponsiveValue<string | number>
}

type OverlayMenuItemProps = {
  label: string
  sublabel: string
  icon?: React.ComponentType<IconProps> | React.ReactElement
  iconRight?: React.ComponentType<IconProps> | React.ReactElement
}

export const OverlayMenuItem: React.FC<OverlayMenuItemProps & React.ComponentPropsWithoutRef<'button'>> = ({
  label,
  sublabel,
  icon: IconComp,
  iconRight: IconRightComp,
  ...buttonProps
}) => {
  return (
    <button {...buttonProps}>
      <Shelf gap={3} px={3} py={1}>
        {IconComp && isComponent(IconComp) ? <IconComp size="iconMedium" /> : IconComp}
        <Stack>
          <Text variant="interactive">{label}</Text>
          <Text variant="label2">{sublabel}</Text>
        </Stack>
        {IconRightComp && (isComponent(IconRightComp) ? <IconRightComp size="iconSmall" /> : IconRightComp)}
      </Shelf>
    </button>
  )
}

function isComponent(object: any): object is React.ComponentType<any> {
  return typeof object === 'function'
}

export function usePopoverMenu() {}
