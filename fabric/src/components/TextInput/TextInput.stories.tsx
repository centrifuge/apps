import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { DateInput, NumberInput, SearchInput, TextAreaInput, TextInput } from '.'
import { Stack } from '../Stack'

export default {
  title: 'Components/TextInput',
  component: TextInput,
} as ComponentMeta<typeof TextInput>

type TextInputStory = ComponentStory<typeof TextInput>
const Template: TextInputStory = (args) => (
  <Stack gap={3}>
    <TextInput {...args} />
    <TextInput {...args} label="" />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Placeholder',
  label: 'Label',
  errorMessage: '',
  disabled: false,
}

const SearchTemplate: TextInputStory = (args) => (
  <Stack gap={3}>
    <SearchInput {...args} />
    <SearchInput {...args} label="" />
  </Stack>
)
export const Search = SearchTemplate.bind({})
Search.args = {
  placeholder: 'Search',
  label: 'Label',
  errorMessage: '',
  disabled: false,
}

const DateTemplate: TextInputStory = (args) => (
  <Stack gap={3}>
    <DateInput {...args} />
    <DateInput {...args} label="" />
  </Stack>
)
export const Date = DateTemplate.bind({})
Date.args = {
  label: 'Date',
  errorMessage: '',
  disabled: false,
}

const NumberTemplate: TextInputStory = (args) => (
  <Stack gap={3}>
    <NumberInput {...args} />
    <NumberInput {...args} label="" />
  </Stack>
)
export const Number = NumberTemplate.bind({})
Number.args = {
  label: 'Number',
  placeholder: '00.00',
  errorMessage: '',
  disabled: false,
}

type TextAreaStory = ComponentStory<typeof TextAreaInput>
const TextAreaTemplate: TextAreaStory = (args) => (
  <Stack gap={3}>
    <TextAreaInput {...args} />
    <TextAreaInput {...args} label="" />
  </Stack>
)
export const TextArea = TextAreaTemplate.bind({})
TextArea.args = {
  label: 'Label',
  placeholder: 'Add description...',
  errorMessage: '',
  disabled: false,
}
