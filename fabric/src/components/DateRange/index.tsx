import * as React from 'react'
import { Box } from '../Box'
import { Select, SelectOptionItem } from '../Select'

export type DateRangeProps = {
  onSelection: (start: Date, end: Date, range: RangeOptionValue) => void
  defaultOption?: RangeOption
  end: Date
}

type RangeOption = SelectOptionItem & {
  label: 'Last week' | 'Last month' | 'Last year'
  value: 'last-week' | 'last-month' | 'last-year'
}
export type RangeOptionValue = RangeOption['value']

export const rangeOptions: RangeOption[] = [
  {
    label: 'Last week',
    value: 'last-week',
  },
  {
    label: 'Last month',
    value: 'last-month',
  },
  {
    label: 'Last year',
    value: 'last-year',
  },
]

const getDate = {
  'last-week': ($date: Date) => {
    const date = new Date($date)
    return new Date(date.setDate(date.getDate() - 7))
  },
  'last-month': ($date: Date) => {
    const date = new Date($date)
    return new Date(date.setMonth(date.getMonth() - 1))
  },
  'last-year': ($date: Date) => {
    const date = new Date($date)
    return new Date(date.setFullYear(date.getFullYear() - 1))
  },
} as const

export function DateRange({ onSelection, defaultOption = rangeOptions[1], end }: DateRangeProps) {
  const [value, setValue] = React.useState(defaultOption.value)
  const [startDate, setStartDate] = React.useState(getDate[defaultOption.value](end))

  React.useEffect(() => {
    onSelection(startDate, end, value)
  }, [startDate, end, value])

  return (
    <Box>
      <Box position="relative">
        <Select
          name="date-range"
          label="Date range"
          options={rangeOptions}
          value={value}
          onChange={({ target }) => {
            setValue(target.value as RangeOptionValue)
            setStartDate(getDate[target.value](end))
          }}
        />
      </Box>
    </Box>
  )
}
