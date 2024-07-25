import { Tabs, TabsItem, TabsItemProps } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'

type Props = {
  children: (React.ReactElement<TabsItemProps> | string | boolean | null | undefined)[]
}

export function NavigationTabs({ children }: Props) {
  const location = useLocation()
  let matchedIndex = -1

  React.Children.forEach(children, (child, i) => {
    if (!React.isValidElement(child)) return
    if (location.pathname.startsWith(`${child.props.to}`)) {
      matchedIndex = i
    }
  })

  const index = matchedIndex !== -1 ? matchedIndex : 0

  return <Tabs selectedIndex={index}>{children}</Tabs>
}

export function NavigationTabsItem(props: TabsItemProps) {
  return <TabsItem as={Link} {...props} />
}
