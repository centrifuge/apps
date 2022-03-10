import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { FileUpload } from '.'

export default {
  title: 'Components/FileUpload',
  component: FileUpload,
} as ComponentMeta<typeof FileUpload>

type FileUploadStory = ComponentStory<typeof FileUpload>
const Template: FileUploadStory = (args) => <FileUpload {...args} />

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Add file',
  label: 'Upload file',
  errorMessage: '',
  disabled: false,
  loading: false,
}
