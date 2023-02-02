import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { ImageUpload } from '.'

export default {
  title: 'Components/ImageUpload',
  component: ImageUpload,
} as ComponentMeta<typeof ImageUpload>

type ImageUploadStory = ComponentStory<typeof ImageUpload>
const Template: ImageUploadStory = (args) => <ImageUpload {...args} />

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Not set',
  label: 'Upload Image',
  requirements: 'JPG/PNG/SVG, max 1MB',
  errorMessage: '',
  disabled: false,
  loading: false,
  aspectRatio: '1 / 1',
  height: '',
}
