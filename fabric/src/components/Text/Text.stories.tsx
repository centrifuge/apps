import { ComponentMeta } from '@storybook/react'
import React from 'react'
import { useTheme } from 'styled-components'
import { Text } from '.'

export default {
  title: 'Components/Text',
  component: Text,
} as ComponentMeta<typeof Text>

export const TextVariants: React.FC = () => {
  const theme = useTheme()
  return (
    <div>
      {Object.keys(theme.typography).map((variant: any) => (
        <Text variant={variant}>{variant}</Text>
      ))}
    </div>
  )
}

export const BodyText: React.FC = () => {
  return (
    <>
      <Text variant="heading2">Body 1</Text>
      <Text variant="body1" as="p">
        Lorem ipsum dolor sit amet <Text variant="emphasized">consectetur adipisicing</Text> elit. Corporis, ex?
        Nesciunt consequatur consectetur magnam delectus distinctio ipsa{' '}
        <Text variant="emphasized">tempore maiores</Text> pariatur ipsum necessitatibus harum ea, labore quas impedit id
        iure perferendis.
      </Text>
      <Text variant="heading2">Body 2</Text>
      <Text variant="body2" as="p">
        Lorem ipsum dolor sit amet <Text variant="emphasized">consectetur adipisicing</Text> elit. Corporis, ex?
        Nesciunt consequatur consectetur magnam delectus distinctio ipsa{' '}
        <Text variant="emphasized">tempore maiores</Text> pariatur ipsum necessitatibus harum ea, labore quas impedit id
        iure perferendis.
      </Text>
    </>
  )
}
