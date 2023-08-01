import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { DateRange } from '.'
import { Text } from '../Text'

export default {
  title: 'Components/DateRange',
  component: DateRange,
} as ComponentMeta<typeof DateRange>

type DateRangeStory = ComponentStory<typeof DateRange>
const Template: DateRangeStory = () => {
  const [start, setStart] = React.useState(new Date(new Date().setDate(new Date().getDate() - 7)))
  const [end, setEnd] = React.useState(new Date())

  return (
    <div>
      <DateRange
        end={end}
        onSelection={(startDate, endDate) => {
          setStart(startDate)
          setEnd(endDate)
        }}
      />

      <Text as="span" variant="body3" color="textSecondary">
        <time dateTime={start.toISOString()}>{start.toLocaleDateString()}</time>
        {' - '}
        <time dateTime={end.toISOString()}>{end.toLocaleDateString()}</time>
      </Text>
    </div>
  )
}

export const Default = Template.bind({})
