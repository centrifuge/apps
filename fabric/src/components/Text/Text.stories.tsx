import { ComponentMeta } from '@storybook/react'
import React from 'react'
import { useTheme } from 'styled-components'
import { Text } from '.'
import { TextVariantName } from '../../theme'
import { Stack } from '../Stack'

export default {
  title: 'Components/Text',
  component: Text,
} as ComponentMeta<typeof Text>

export const Variants: React.FC = () => {
  const theme = useTheme()
  return (
    <Stack gap={2}>
      {Object.keys(theme.typography).map((variant: TextVariantName, i) => (
        <Text variant={variant} key={i}>
          {variant}
        </Text>
      ))}
    </Stack>
  )
}

export const Body: React.FC = () => {
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text variant="heading2">Body 1</Text>
        <Text variant="body1" as="p">
          Lorem ipsum dolor sit amet <Text variant="emphasized">consectetur adipisicing</Text> elit. Corporis, ex?
          Nesciunt consequatur consectetur magnam delectus distinctio ipsa{' '}
          <Text variant="emphasized">tempore maiores</Text> pariatur ipsum necessitatibus harum ea, labore quas impedit
          id iure perferendis.
        </Text>
      </Stack>
      <Stack gap={1}>
        <Text variant="heading2">Body 2</Text>
        <Text variant="body2" as="p">
          Lorem ipsum dolor sit amet <Text variant="emphasized">consectetur adipisicing</Text> elit. Corporis, ex?
          Nesciunt consequatur consectetur magnam delectus distinctio ipsa{' '}
          <Text variant="emphasized">tempore maiores</Text> pariatur ipsum necessitatibus harum ea, labore quas impedit
          id iure perferendis.
        </Text>
      </Stack>
    </Stack>
  )
}
