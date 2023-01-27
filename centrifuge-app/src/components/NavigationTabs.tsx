import { Tabs, TabsItem, TabsItemProps } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'

type Props = {
  basePath?: string
  children: (React.ReactElement<TabsItemProps> | string | boolean | null | undefined)[]
}

export function NavigationTabs({ basePath = '', children }: Props) {
  const match = useRouteMatch<{ tab: string }>(`${basePath}/:tab`)
  let matchedIndex = -1
  React.Children.forEach(children, (child, i) => {
    if (!React.isValidElement(child)) return
    if (child.props.to?.endsWith(match?.params.tab)) {
      matchedIndex = i
    }
  })
  const index = matchedIndex !== -1 ? matchedIndex : 0

  return <Tabs selectedIndex={index}>{children}</Tabs>
}

export function NavigationTabsItem(props: TabsItemProps) {
  return <TabsItem as={Link} {...props} />
}
