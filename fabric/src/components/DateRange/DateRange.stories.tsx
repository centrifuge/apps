import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { DateRange } from '.'

export default {
  title: 'Components/DateRange',
  component: DateRange,
} as ComponentMeta<typeof DateRange>

type DateRangeStory = ComponentStory<typeof DateRange>
const Template: DateRangeStory = () => {
  const [start, setStart] = React.useState(new Date())
  const [end, setEnd] = React.useState(new Date(new Date().getDay() - 7))

  return (
    <div>
      <DateRange
        start={start}
        end={end}
        onSelection={(startDate, endDate) => {
          setStart(startDate)
          setEnd(endDate)
        }}
      />
    </div>
  )
}

export const Default = Template.bind({})
