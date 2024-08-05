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

const StyledTabsItem = styled.button<{ $active?: boolean }>(
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
  ({ $active, theme }) => {
    return css({
      paddingTop: 1,
      paddingLeft: 2,
      paddingRight: 2,
      paddingBottom: 2,
      color: $active ? 'textSelected' : 'textPrimary',
      boxShadow: $active ? `inset 0 -2px 0 ${theme.colors.borderSelected}` : 'none',

      '&:hover, &:active, &:focus-visible': {
        color: 'textSelected',
      },
    })
  }
)

export type TabsItemProps = Omit<PropsOf<typeof StyledTabsItem>, '$active' | 'ariaLabel'>

type TabsItemPrivateProps = TabsItemProps & {
  active?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export function TabsItem({ children, active, onClick, ariaLabel, ...rest }: TabsItemPrivateProps) {
  return (
    <StyledTabsItem onClick={onClick} $active={active} role="tab" aria-label={ariaLabel} {...rest}>
      <Text variant="interactive1" color="inherit">
        {children}
      </Text>
    </StyledTabsItem>
  )
}
