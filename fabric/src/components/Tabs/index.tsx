import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { PropsOf } from '../../utils/types'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

export type TabsProps = {
  selectedIndex: number
  onChange?: (index: number) => void
  children: (React.ReactElement<TabsItemProps> | string | boolean | null | undefined)[]
  variant?: 'primary' | 'secondary'
}

export function Tabs({ selectedIndex, onChange, children }: TabsProps) {
  return (
    <Shelf role="tablist">
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              active: index === selectedIndex,
              onClick: () => {
                if (selectedIndex !== index) onChange?.(index)
              },
              tabIndex: index === selectedIndex ? -1 : undefined,
            })
          : child
      )}
    </Shelf>
  )
}

const StyledTabsItem = styled.button<{
  $active?: boolean
  styleOverrides?: React.CSSProperties
  showBorder?: boolean
  variant: 'primary' | 'secondary'
}>(
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'color, box-shadow',
    transitionDuration: '100ms',
    transitionTimingFunction: 'ease-in-out',
    border: 0,
    userSelect: 'none',
    appearance: 'none',
    background: 'transparent',
  },
  ({ $active, theme, styleOverrides, showBorder, variant }) => {
    console.log(variant)
    return css({
      paddingTop: 1,
      paddingLeft: 2,
      paddingRight: 2,
      paddingBottom: 2,
      color: $active ? 'textPrimary' : 'textSecondary',
      boxShadow: $active
        ? `inset 0 -2px 0 ${variant === 'secondary' ? theme.colors.textPrimary : theme.colors.textGold}`
        : showBorder
        ? `inset 0 -2px 0 ${theme.colors.textDisabled}`
        : 'none',
      fontWeight: 400,

      '&:hover, &:active, &:focus-visible': {
        color: $active ? 'textPrimary' : 'textGold',
      },
      ...styleOverrides,
    })
  }
)

export type TabsItemProps = Omit<PropsOf<typeof StyledTabsItem>, '$active' | 'ariaLabel'> & {
  styleOverrides?: React.CSSProperties
  showBorder?: boolean
}
type TabsItemPrivateProps = TabsItemProps & {
  active?: boolean
  onClick?: () => void
  ariaLabel?: string
  styleOverrides?: React.CSSProperties
  showBorder?: boolean
}

export function TabsItem({
  children,
  active,
  onClick,
  ariaLabel,
  styleOverrides,
  showBorder,
  variant = 'primary',
  ...rest
}: TabsItemPrivateProps) {
  return (
    <StyledTabsItem
      onClick={onClick}
      $active={active}
      role="tab"
      aria-label={ariaLabel}
      styleOverrides={styleOverrides}
      showBorder={showBorder}
      variant={variant}
      {...rest}
    >
      <Text variant="interactive1" color="inherit" fontWeight={400}>
        {children}
      </Text>
    </StyledTabsItem>
  )
}
