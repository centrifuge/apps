import { Box, IconFilter, Text } from '@centrifuge/fabric'
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
  const [isOpen, setIsOpen] = React.useState(false)
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
      <Text as="button" id={`${id}-button`} aria-controls={`${id}-menu`} onClick={() => setIsOpen(!isOpen)}>
        {label}
        <IconFilter color={selectedOptions.length ? 'green' : 'black'} />
      </Text>

      {isOpen && (
        <Box as="form" ref={form} hidden={!isOpen} aria-labelledby={`${id}-button`} aria-expanded={!!isOpen}>
          <Box as="fieldset">
            <Box as="legend" className="visually-hidden">
              Filter {label} by:
            </Box>
            {options.map((option, index) => {
              const value = toKebabCase(option)
              const checked = selectedOptions.includes(value)

              return (
                <Box as="label" key={`${value}${index}`} display="block">
                  <input type="checkbox" name={searchKey} value={value} onChange={handleChange} checked={checked} />
                  {option}
                </Box>
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
      )}
    </Box>
  )
}
