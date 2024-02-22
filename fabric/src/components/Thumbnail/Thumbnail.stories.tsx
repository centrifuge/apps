import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { Thumbnail } from '.'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/Thumbnail',
  component: Thumbnail,
} as Meta<typeof Thumbnail>

type ThumbnailStory = StoryFn<typeof Thumbnail>
const Template: ThumbnailStory = (args) => (
  <Shelf gap={2}>
    <Thumbnail {...args} type="token" />
    <Thumbnail {...args} type="pool" />
    <Thumbnail {...args} type="asset" />
    <Thumbnail {...args} type="nft" />
  </Shelf>
)

export const Default = Template.bind({})
Default.args = {
  label: 'TP2SEN',
  size: 'large',
  type: 'token',
}
