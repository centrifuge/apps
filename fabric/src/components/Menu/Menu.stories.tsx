import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Menu, MenuItem } from '.'
import { IconCheck, IconCircle } from '../..'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/Menu',
  component: Menu,
} as ComponentMeta<typeof Menu>

type MenuStory = ComponentStory<typeof Menu>
const Template: MenuStory = (args) => (
  <Shelf gap={8} flexWrap="wrap">
    <Menu {...args} width={300} maxWidth="100%">
      <MenuItem label="Menu Item 1" sublabel="optional sublabel" icon={IconCircle} iconRight={IconCheck} />
      <MenuItem label="Menu Item 2" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 3" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 4" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 5" sublabel="optional sublabel" icon={IconCircle} />
    </Menu>
    <Menu {...args}>
      <MenuItem label="Menu Item 1" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 2" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 3" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 4" sublabel="optional sublabel" icon={IconCircle} />
      <MenuItem label="Menu Item 5" sublabel="optional sublabel" icon={IconCircle} />
    </Menu>
    <Menu {...args}>
      <MenuItem label="Menu Item 1" sublabel="optional sublabel" />
      <MenuItem label="Menu Item 2" sublabel="optional sublabel" />
      <MenuItem label="Menu Item 3" sublabel="optional sublabel" />
      <MenuItem label="Menu Item 4" sublabel="optional sublabel" />
      <MenuItem label="Menu Item 5" sublabel="optional sublabel" />
    </Menu>
    <Menu {...args}>
      <MenuItem label="Menu Item 1" />
      <MenuItem label="Menu Item 2" />
      <MenuItem label="Menu Item 3" />
      <MenuItem label="Menu Item 4" />
      <MenuItem label="Menu Item 5" />
    </Menu>
  </Shelf>
)

export const Default = Template.bind({})
