import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { TextWithPlaceholder } from '.'
import { TextVariantName } from '../../theme'
import { Stack } from '../Stack'
import { Text } from '../Text'

export default {
  title: 'Components/TextWithPlaceholder',
  component: TextWithPlaceholder,
} as ComponentMeta<typeof TextWithPlaceholder>

type TextWithPlaceholderStory = ComponentStory<typeof TextWithPlaceholder>

const ParagraphTemplate: TextWithPlaceholderStory = (args) => (
  <Stack gap={3}>
    <Stack gap={1}>
      <TextWithPlaceholder variant="heading2" isLoading={args.isLoading}>
        Body 1
      </TextWithPlaceholder>
      <TextWithPlaceholder variant="body1" as="p" {...args} style={{ maxWidth: '70ch' }}>
        Lorem ipsum dolor sit amet <Text variant="emphasized">consectetur adipisicing</Text> elit. Corporis, ex?
        Nesciunt consequatur consectetur magnam delectus distinctio ipsa{' '}
        <Text variant="emphasized">tempore maiores</Text> pariatur ipsum necessitatibus harum ea, labore quas impedit id
        iure perferendis.
      </TextWithPlaceholder>
    </Stack>
  </Stack>
)

export const Paragraph = ParagraphTemplate.bind({})
Paragraph.args = {
  isLoading: true,
  width: 170,
}

const VariantsTemplate: TextWithPlaceholderStory = (args) => {
  const theme = useTheme()
  return (
    <Stack gap={2}>
      {Object.keys(theme.typography).map((variant: TextVariantName, i) => (
        <TextWithPlaceholder variant={variant} key={i} {...args}>
          {variant}
        </TextWithPlaceholder>
      ))}
    </Stack>
  )
}

export const Variants = VariantsTemplate.bind({})
Variants.args = {
  isLoading: true,
}
