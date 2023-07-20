import * as React from 'react'
import styled from 'styled-components'
import { Shelf } from '../Shelf'

export type SideNavigationProps = {
  items: {
    label: string
    href: string
    isActive: boolean
  }[]
}

export function SideNavigation({ items }: SideNavigationProps) {
  return (
    <SideNavigationContainer>
      {items.map(({ label, href, isActive }) => (
        <SideNavigationItem href={href} isActive={isActive}>
          {label}
        </SideNavigationItem>
      ))}
    </SideNavigationContainer>
  )
}

export function SideNavigationContainer({ children }: { children: React.ReactNode }) {
  return (
    <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
      {children}
    </Shelf>
  )
}

export const SideNavigationItem = styled.a<{ isActive: boolean }>`
  display: block;
  padding: 8px 16px;
  border-radius: 20px;

  color: ${({ theme, isActive }) => (isActive ? theme.colors.textInverted : theme.colors.textPrimary)};
  box-shadow: ${({ theme, isActive }) => (isActive ? theme.shadows.cardInteractive : 'none')};
  background: ${({ theme, isActive }) => (isActive ? theme.colors.textSelected : 'transparent')};
`
