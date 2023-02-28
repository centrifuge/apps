import * as React from 'react'
import styled from 'styled-components'
import { IconX } from '../../icon'
import { Box } from '../Box'
import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { Select } from '../Select'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { DateInput } from '../TextInput'

export type DateRangeProps = {
  onSelection: (start: Date, end: Date) => void
  defaultOption?: (typeof rangeOptions)[number]
  start?: Date
  end?: Date
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

const EditButton = styled(Text)`
  flex-grow: 2;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  border: 0;
  background-color: transparent;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`

const ClearButton = styled(Box)`
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`

export function DateRange({ onSelection, defaultOption = rangeOptions[1], start, end }: DateRangeProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultOption.value)
  const [startDate, setStartDate] = React.useState(start || new Date())
  const [endDate, setEndDate] = React.useState(end || new Date())
  const [isCustom, setIsCustom] = React.useState(false)
  const [customStartDate, setCustomStartDate] = React.useState<Date>()
  const [customEndDate, setCustomEndDate] = React.useState<Date>()

  React.useEffect(() => {
    setStartDate(getDate[defaultOption.value](endDate))
  }, [])

  React.useEffect(() => {
    if (!open) {
      onSelection(startDate, endDate)
    }
  }, [open, startDate, endDate, value])

  React.useEffect(() => {
    if (!isCustom) {
      setStartDate(getDate[value](new Date()))
      setEndDate(getDate[value](new Date()))
    }
  }, [isCustom])

  return (
    <Box>
      <Box position="relative">
        <Select
          disabled={isCustom}
          name="date-range"
          outlined={true}
          options={[
            ...rangeOptions,
            {
              value: 'custom',
              label: 'Custom',
            },
          ]}
          value={value}
          onChange={({ target }) => {
            if (target.value === 'custom') {
              setOpen(true)
              return
            }

            setValue(target.value)
            setStartDate(getDate[target.value](endDate))
          }}
        />
        {isCustom && (
          <Shelf
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            py={1}
            pr={1}
            pl={2}
            backgroundColor="backgroundSecondary"
            borderRadius="input"
            border="1px solid"
            borderColor="borderButtonSecondaryDisabled"
          >
            <EditButton forwardedAs="button" variant="body1" onClick={() => setOpen(true)}>
              Edit custom
            </EditButton>
            <Box width="1px" mx={1} height="100%" backgroundColor="borderButtonSecondaryDisabled" />
            <ClearButton
              as="button"
              width="iconMedium"
              height="iconMedium"
              onClick={() => setIsCustom(false)}
              border={0}
              backgroundColor="transparent"
            >
              <IconX />
            </ClearButton>
          </Shelf>
        )}
      </Box>

      {open && (
        <Dialog isOpen={open} onClose={() => setOpen(false)} title="Date range">
          <Shelf gap={2}>
            <DateInput
              value={toIsoDate(customStartDate || startDate)}
              onChange={(event) => {
                setCustomStartDate(new Date(event.target.value))
              }}
              max={toIsoDate(endDate)}
            />
            <DateInput
              value={toIsoDate(customEndDate || endDate)}
              onChange={(event) => {
                setCustomEndDate(new Date(event.target.value))
              }}
              min={toIsoDate(startDate)}
            />
          </Shelf>

          <Shelf gap={2} justifyContent="end" mt={1}>
            <Button onClick={() => setOpen(false)} small variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                setIsCustom(true)

                customStartDate && setStartDate(customStartDate)
                customEndDate && setEndDate(customEndDate)
              }}
              small
              variant="primary"
            >
              Select
            </Button>
          </Shelf>
        </Dialog>
      )}
    </Box>
  )
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

// function toLocaleDate(timestamp: number | string | Date) {
//   return new Date(timestamp).toLocaleDateString('en-US', {
//     year: '2-digit',
//     month: 'numeric',
//     day: 'numeric',
//   })
// }
