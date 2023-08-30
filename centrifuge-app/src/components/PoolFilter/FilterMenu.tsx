import { Box, Checkbox, Divider, IconFilter, Menu, Popover, Stack, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { FilterButton, QuickAction } from './styles'
import { SearchKeys } from './types'
import { toKebabCase } from './utils'

export type FilterMenuProps = {
  label: string
  options: string[]
  searchKey: SearchKeys['ASSET_CLASS' | 'POOL_STATUS']
  tooltip: string
}

export function FilterMenu({ label, options, searchKey, tooltip }: FilterMenuProps) {
  const history = useHistory()
  const { pathname, search } = useLocation()

  const form = React.useRef<HTMLFormElement>(null)

  const restSearchParams = React.useMemo(() => {
    const searchParams = new URLSearchParams(search)
    searchParams.delete(searchKey)
    return searchParams
  }, [search])

  const selectedOptions = React.useMemo(() => {
    const searchParams = new URLSearchParams(search)
    return searchParams.getAll(searchKey)
  }, [search])

  function handleChange() {
    const formData = new FormData(form.current ?? undefined)
    const entries = formData.getAll(searchKey) as string[]
    const searchParams = new URLSearchParams(entries.map((entry) => [searchKey, entry]))

    history.push({
      pathname,
      search: `?${searchParams}${restSearchParams.size > 0 ? `&${restSearchParams}` : ''}`,
    })
  }

  function deselectAll() {
    history.push({
      pathname,
      search: restSearchParams.size > 0 ? `?${restSearchParams}` : '',
    })
  }

  function selectAll() {
    const searchParams = new URLSearchParams(options.map((option) => [searchKey, toKebabCase(option)]))

    history.push({
      pathname,
      search: `?${searchParams}${restSearchParams.size > 0 ? `&${restSearchParams}` : ''}`,
    })
  }

  return (
    <Box position="relative">
      <Popover
        placement="bottom left"
        renderTrigger={(props, ref, state) => {
          return (
            <Box ref={ref}>
              <Tooltip body={tooltip} {...props} style={{ display: 'block' }}>
                <FilterButton forwardedAs="span" variant="body3">
                  {label}
                  <IconFilter color={selectedOptions.length ? 'textSelected' : 'textSecondary'} size="1em" />
                </FilterButton>
              </Tooltip>
            </Box>
          )
        }}
        renderContent={(props, ref) => (
          <Box {...props} ref={ref}>
            <Menu width={300}>
              <Stack as="form" ref={form} p={[2, 3]} gap={2}>
                <Stack as="fieldset" borderWidth={0} gap={2}>
                  <Box as="legend" className="visually-hidden">
                    Filter {label} by:
                  </Box>
                  {options.map((option, index) => {
                    const value = toKebabCase(option)
                    const checked = selectedOptions.includes(value)

                    return (
                      <Checkbox
                        key={`${value}${index}`}
                        name={searchKey}
                        value={value}
                        onChange={handleChange}
                        checked={checked}
                        label={option}
                        extendedClickArea
                      />
                    )
                  })}
                </Stack>

                <Divider borderColor="textPrimary" />

                {selectedOptions.length === options.length ? (
                  <QuickAction variant="body1" forwardedAs="button" type="button" onClick={() => deselectAll()}>
                    Deselect all
                  </QuickAction>
                ) : (
                  <QuickAction variant="body1" forwardedAs="button" type="button" onClick={() => selectAll()}>
                    Select all
                  </QuickAction>
                )}
              </Stack>
            </Menu>
          </Box>
        )}
      />
    </Box>
  )
}
