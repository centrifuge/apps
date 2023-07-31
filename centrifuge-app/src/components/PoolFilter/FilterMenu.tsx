import { Box, Checkbox, IconFilter, Menu, Popover, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SearchKeys } from './types'
import { toKebabCase } from './utils'

export type FilterMenuProps = {
  label: string
  options: string[]
  searchKey: SearchKeys['ASSET_CLASS' | 'POOL_STATUS']
}

export function FilterMenu({ label, options, searchKey }: FilterMenuProps) {
  const history = useHistory()
  const { pathname, search } = useLocation()
  const id = React.useId()

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
        isDismissable={false}
        placement="bottom left"
        renderTrigger={(props, ref, state) => (
          <Text ref={ref} {...props} active={state.isOpen} as="button">
            {label}
            <IconFilter color={selectedOptions.length ? 'green' : 'black'} />
          </Text>
        )}
        renderContent={(props, ref) => (
          <Box {...props} ref={ref}>
            <Menu width={300}>
              <Box as="form" ref={form} p={2}>
                <Box as="fieldset" borderWidth={0}>
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
                      />
                    )
                  })}
                </Box>

                {selectedOptions.length === options.length ? (
                  <button type="button" onClick={() => deselectAll()}>
                    Deselect all
                  </button>
                ) : (
                  <button type="button" onClick={() => selectAll()}>
                    Select all
                  </button>
                )}
              </Box>
            </Menu>
          </Box>
        )}
      />
    </Box>
  )
}
