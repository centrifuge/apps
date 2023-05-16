import * as React from 'react'
import { Box } from '../Box'
import { Select } from '../Select'

export type DateRangeProps = {
  onSelection: (start: Date, end: Date) => void
  defaultOption?: (typeof rangeOptions)[number]
  start: Date
  end: Date
}

export const rangeOptions = [
  {
    value: 'last-week',
    label: 'Last week',
  },
  {
    value: 'last-month',
    label: 'Last month',
  },
  {
    value: 'last-year',
    label: 'Last year',
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

export function DateRange({ onSelection, defaultOption = rangeOptions[1], start, end }: DateRangeProps) {
  const [value, setValue] = React.useState(defaultOption.value)
  const [startDate, setStartDate] = React.useState(start || new Date())

  React.useEffect(() => {
    setStartDate(getDate[defaultOption.value](end))
  }, [])

  React.useEffect(() => {
    onSelection(startDate, end)
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
            setValue(target.value)
            setStartDate(getDate[target.value](end))
          }}
        />
      </Box>
    </Box>
  )
}
