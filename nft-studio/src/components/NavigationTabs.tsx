import { Tabs, TabsItem, TabsItemProps } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'

type Props = {
  basePath?: string
  children: React.ReactNode[]
}

export const NavigationTabs: React.VFC<Props> = ({ basePath = '', children }) => {
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

export const NavigationTabsItem: React.FC<TabsItemProps> = (props) => {
  return <TabsItem as={Link} {...props} />
}
