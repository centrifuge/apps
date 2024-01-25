import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { ImageUpload } from '.'
import { Stack } from '../Stack'

export default {
  title: 'Components/ImageUpload',
  component: ImageUpload,
} as Meta<typeof ImageUpload>

type ImageUploadStory = StoryFn<typeof ImageUpload>
const Template: ImageUploadStory = (args) => (
  <Stack gap={4}>
    <ImageUpload {...args} />
    <ImageUpload {...args} height="300px" label="Bigger preview" />
    <ImageUpload {...args} height="150px" aspectRatio="16/9" label="Different aspect ratio" />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Not set',
  label: 'Upload Image',
  requirements: 'JPG/PNG/SVG, max 1MB',
  errorMessage: '',
  disabled: false,
  loading: false,
  height: '',
}
