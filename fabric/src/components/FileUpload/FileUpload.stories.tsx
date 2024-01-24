import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { FileUpload } from '.'

export default {
  title: 'Components/FileUpload',
  component: FileUpload,
} as Meta<typeof FileUpload>

type FileUploadStory = StoryFn<typeof FileUpload>
const Template: FileUploadStory = (args) => <FileUpload {...args} />

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Add file',
  label: 'Upload file',
  errorMessage: '',
  disabled: false,
  loading: false,
}
