import { Meta, StoryFn } from '@storybook/react'
import * as React from 'react'
import { DateInput, InputAction, NumberInput, SearchInput, TextAreaInput, TextInput } from '.'
import { SelectInner } from '../Select'
import { Stack } from '../Stack'

export default {
  title: 'Components/TextInput',
  component: TextInput,
} as Meta<typeof TextInput>

type TextInputStory = StoryFn<typeof TextInput>
const Template: TextInputStory = (args) => (
  <Stack gap={3}>
    <TextInput {...args} label="" secondaryLabel="" />
    <TextInput {...args} symbol="USDC" />
    <TextInput {...args} symbol="USDC" action={<InputAction disabled={args.disabled}>Max</InputAction>} />
    <TextInput
      {...args}
      symbol={
        <SelectInner
          value="USDC"
          options={[
            { label: 'USDC', value: 'USDC' },
            { label: 'USDT', value: 'USDT' },
          ]}
        />
      }
    />
  </Stack>
)

export const Default = Template.bind({})
Default.args = {
  placeholder: 'Placeholder',
  label: 'Label',
  secondaryLabel: 'Secondary label',
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

type TextAreaStory = StoryFn<typeof TextAreaInput>
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
