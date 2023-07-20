import * as React from 'react'
import styled from 'styled-components'
import { Shelf } from '../Shelf'

export type NavigationProps = {
  items: {
    label: string
    href: string
    isActive: boolean
  }[]
}

export function Navigation({ items }: NavigationProps) {
  return (
    <NavigationContainer>
      {items.map(({ label, href, isActive }) => (
        <NavigationItem href={href} isActive={isActive}>
          {label}
        </NavigationItem>
      ))}
    </NavigationContainer>
  )
}

export function NavigationContainer({ children }: { children: React.ReactNode }) {
  return (
    <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
      {children}
    </Shelf>
  )
}

export const NavigationItem = styled.a<{ isActive: boolean }>`
  display: block;
  padding: 8px 16px;
  border-radius: 20px;

  color: ${({ theme, isActive }) => (isActive ? theme.colors.textInverted : theme.colors.textPrimary)};
  box-shadow: ${({ theme, isActive }) => (isActive ? theme.shadows.cardInteractive : 'none')};
  background: ${({ theme, isActive }) => (isActive ? theme.colors.textSelected : 'transparent')};
`
