import * as React from 'react'
import { Tabs, TabsItem } from '.'

export default {
  title: 'Components/Tabs',
}

export const Default: React.FC = () => {
  return (
    <Tabs selectedIndex={0}>
      <TabsItem>Tab 1</TabsItem>
      <TabsItem>Tab 2</TabsItem>
      <TabsItem>Tab 3</TabsItem>
    </Tabs>
  )
}
