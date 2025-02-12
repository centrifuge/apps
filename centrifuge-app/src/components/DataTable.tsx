import {
  Box,
  Checkbox,
  Divider,
  Grid,
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  Menu,
  Popover,
  Shelf,
  Stack,
  Text,
  Tooltip,
} from '@centrifuge/fabric'

import css from '@styled-system/css'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { getIn } from 'formik'
import * as React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { FiltersState } from '../utils/useFilters'
import { FilterButton } from './FilterButton'
import { QuickAction } from './QuickAction'

type GroupedProps = {
  groupIndex?: number
  lastGroupIndex?: number
}

export type DataTableProps<T = any> = {
  data: Array<T>
  /**
   * pinnedData is not included in sorting and will be pinned to the top of the table in the order provided
   *  */
  pinnedData?: Array<T>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: T) => string | LinkProps['to']
  defaultSortKey?: string
  defaultSortOrder?: OrderBy
  hoverable?: boolean
  scrollable?: boolean
  /**
   * summary row is not included in sorting
   */
  summary?: T
  footer?: React.ReactNode
  pageSize?: number
  page?: number
  hideHeader?: boolean
  hideBorder?: boolean
  rowProps?: React.HTMLAttributes<HTMLDivElement>
} & GroupedProps

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | React.ReactElement
  cell: (row: any, index: number) => React.ReactNode
  align?: string
  sortKey?: string
  width?: string
  isLabel?: boolean
}
const sorter = <T extends Record<string, any>>(data: Array<T>, order: OrderBy, sortKey?: string) => {
  if (!sortKey) return data
  const up = order === 'asc' ? 1 : -1
  const down = order === 'asc' ? -1 : 1

  return data.sort((a, b) => {
    const A = getIn(a, sortKey)
    const B = getIn(b, sortKey)
    try {
      if ((A instanceof Decimal && B instanceof Decimal) || (BN.isBN(A) && BN.isBN(B)))
        return A.gt(B as any) ? up : down

      if (typeof A === 'string' && typeof B === 'string') {
        return new BN(A).gt(new BN(B)) ? up : down
      }
    } catch {}

    return A > B ? up : down
  })
}

export const DataTable = <T extends Record<string, any>>({
  data,
  pinnedData,
  columns,
  keyField,
  onRowClicked,
  defaultSortKey,
  hoverable = undefined,
  summary,
  footer,
  groupIndex,
  lastGroupIndex,
  defaultSortOrder = 'desc',
  pageSize = Infinity,
  page = 1,
  hideHeader,
  scrollable = false,
  hideBorder,
  rowProps,
}: DataTableProps<T>) => {
  const theme = useTheme()
  const tableRef = React.useRef<HTMLDivElement>(null)
  const [offsetTop, setOffsetTop] = React.useState(0)
  const [orderBy, setOrderBy] = React.useState<Record<string, OrderBy>>(
    defaultSortKey ? { [defaultSortKey]: defaultSortOrder } : {}
  )

  React.useEffect(() => {
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect()
      const offsetFromTopOfScreen = rect.top + window.scrollY
      setOffsetTop(offsetFromTopOfScreen)
    }
  }, [])

  const [currentSortKey, setCurrentSortKey] = React.useState(defaultSortKey || '')

  const updateSortOrder = (sortKey: Column['sortKey']) => {
    if (!sortKey) return
    const updatedOrderBy = orderBy[sortKey] === 'desc' ? 'asc' : 'desc'
    setOrderBy({ [sortKey]: updatedOrderBy })
    setCurrentSortKey(sortKey)
  }

  const sortedAndPaginatedData = React.useMemo(() => {
    const sortedData = sorter([...data], orderBy[currentSortKey], currentSortKey)
    return sortedData.slice((page - 1) * pageSize, page * pageSize)
  }, [orderBy, data, currentSortKey, page, pageSize])

  const showHeader = groupIndex === 0 || !groupIndex

  const templateColumns = `[start] ${columns.map((col) => col.width ?? 'minmax(min-content, 1fr)').join(' ')} [end]`

  return (
    <TableGrid
      ref={tableRef}
      gridTemplateColumns={templateColumns}
      gridAutoRows="auto"
      gap={0}
      rowGap={0}
      scrollable={scrollable}
      offsetTop={offsetTop}
    >
      {showHeader && (
        <HeaderRow
          styles={
            hideHeader
              ? {
                  backgroundColor: 'transparent',
                  border: 'transparent',
                  borderBottom: `1px solid ${theme.colors.backgroundInverted}`,
                }
              : {}
          }
          scrollable={scrollable}
          hideBorder={hideBorder}
        >
          {columns.map((col, i) => (
            <HeaderCol key={i} align={col?.align} isLabel={col.isLabel}>
              <Text variant="body3">
                {col?.header && typeof col.header !== 'string' && col?.sortKey && React.isValidElement(col.header)
                  ? React.cloneElement(col.header as React.ReactElement<any>, {
                      orderBy: orderBy[col.sortKey],
                      onClick: () => updateSortOrder(col.sortKey),
                    })
                  : col.header}
              </Text>
            </HeaderCol>
          ))}
        </HeaderRow>
      )}

      {pinnedData?.map((row, i) => (
        <DataRow
          hoverable={hoverable}
          // TODO: the onRowClicked should be change to getRowLink to match the behavior
          as={onRowClicked ? Link : 'div'}
          to={onRowClicked ? onRowClicked(row) : undefined}
          key={keyField ? row[keyField] : i}
          tabIndex={onRowClicked ? 0 : undefined}
          hideBorder={hideBorder}
          {...rowProps}
        >
          {columns.map((col, index) => (
            <DataCol variant="body2" align={col?.align} key={index} isLabel={col.isLabel}>
              {col.cell(row, i)}
            </DataCol>
          ))}
        </DataRow>
      ))}
      {sortedAndPaginatedData?.map((row, i) => {
        return (
          <DataRow
            data-testId={`data-table-row-${i}-${groupIndex ?? 0}`}
            hoverable={hoverable}
            as={onRowClicked ? Link : 'div'}
            to={onRowClicked ? onRowClicked(row) : undefined}
            key={keyField ? row[keyField] : i}
            tabIndex={onRowClicked ? 0 : undefined}
            hideBorder={hideBorder}
            {...rowProps}
          >
            {columns.map((col, index) => (
              <DataCol
                data-testId={`data-table-col-${i}-${groupIndex ?? 0}-${col.header}`}
                variant="body2"
                align={col?.align}
                key={index}
                isLabel={col.isLabel}
              >
                {col.cell(row, i)}
              </DataCol>
            ))}
          </DataRow>
        )
      })}
      {/* summary row is not included in sorting */}
      {summary && (
        <DataRow data-testId={`row-summary-${groupIndex ?? 0}`} hideBorder={hideBorder}>
          {columns.map((col, i) => (
            <DataCol variant="body2" key={`${col.sortKey}-${i}`} align={col?.align}>
              {col.cell(summary, i)}
            </DataCol>
          ))}
        </DataRow>
      )}
      {footer}
      {groupIndex != null && groupIndex !== lastGroupIndex && (
        <Row>
          <DataCol />
        </Row>
      )}
    </TableGrid>
  )
}

const TableGrid = styled(Grid)<{ scrollable?: boolean; offsetTop?: number }>`
  ${({ scrollable, offsetTop }) =>
    scrollable &&
    css({
      maxHeight: `calc(100vh - ${offsetTop}px)`,
      paddingBottom: 20,
      overflowY: 'auto',
      overflowX: 'auto',
    })}
`

const Row = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: start / end;
`

const HeaderRow = styled(Row)<{ styles?: any; scrollable?: boolean; hideBorder?: boolean }>(
  ({ styles, scrollable, hideBorder }) =>
    css({
      backgroundColor: 'backgroundSecondary',
      borderStyle: 'solid',
      borderWidth: hideBorder ? 0 : 1,
      borderColor: hideBorder ? 'transparent' : 'borderPrimary',
      position: scrollable ? 'sticky' : 'static',
      top: scrollable ? 0 : 'auto',
      zIndex: scrollable ? 10 : 'auto',
      borderTopLeftRadius: hideBorder ? 0 : '8px',
      borderTopRightRadius: hideBorder ? 0 : '8px',
      ...styles,
    })
)

export const DataRow = styled(Row)<any>`
  ${({ hoverable, as: comp, hideBorder }) =>
    css({
      width: '100%',
      borderBottomStyle: 'solid',
      borderBottomWidth: hideBorder ? 0 : '1px',
      borderBottomColor: hideBorder ? 'transparent' : 'borderPrimary',
      borderLeftStyle: 'solid',
      borderLeftWidth: hideBorder ? 0 : '1px',
      borderLeftColor: hideBorder ? 'transparent' : 'borderPrimary',
      borderRightStyle: 'solid',
      borderRightWidth: hideBorder ? 0 : '1px',
      borderRightColor: hideBorder ? 'transparent' : 'borderPrimary',
      backgroundColor: 'transparent',
      // using a&:hover caused the background sometimes not to update when switching themes
      '&:hover':
        comp === Link
          ? {
              backgroundColor: 'secondarySelectedBackground',
              cursor: 'pointer',
            }
          : hoverable
          ? {
              backgroundColor: 'secondarySelectedBackground',
            }
          : undefined,
      '&:focus-visible': {
        boxShadow: 'inset 0 0 0 3px var(--fabric-focus)',
      },
      '&:last-child': {
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      },
    })}
`

export const DataCol = styled(Text)<{ align: Column['align']; isLabel?: boolean }>`
  background: ${({ isLabel, theme }) => (isLabel ? theme.colors.backgroundSecondary : 'initial')};
  border: none;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  ${({ isLabel }) =>
    isLabel &&
    css({
      position: 'sticky',
      left: 0,
      zIndex: 1,
    })}

  ${({ align }) => {
    switch (align) {
      case 'left':
        return css({
          justifyContent: 'flex-start',
        })
      case 'center':
        return css({
          justifyContent: 'center',
        })
      case 'right':
      default:
        return css({
          textAlign: 'right',
          justifyContent: 'flex-end',
        })
    }
  }}
`

const HeaderCol = styled(DataCol)<{ isLabel?: boolean }>`
  height: 32px;
  align-items: center;

  ${({ isLabel }) =>
    isLabel &&
    css({
      position: 'sticky',
      left: 0,
      zIndex: 2,
      backgroundColor: 'backgroundSecondary',
    })}

  &:has(:focus-visible) {
    box-shadow: inset 0 0 0 3px var(--fabric-focus);
  }
`

export function SortableTableHeader({
  label,
  orderBy,
  onClick,
}: {
  label: string
  orderBy?: OrderBy
  onClick?: () => void
}) {
  return (
    <StyledHeader as="button" type="button" onClick={onClick}>
      <Shelf gap="4px">
        <Text variant="body3" color="currentColor">
          {label}
        </Text>
        <Stack>
          {(orderBy === 'asc' || !orderBy) && <IconChevronUp size={14} style={{ marginBottom: !orderBy ? -3.5 : 0 }} />}
          {(orderBy === 'desc' || !orderBy) && <IconChevronDown size={14} style={{ marginTop: !orderBy ? -3.5 : 0 }} />}
        </Stack>
      </Shelf>
    </StyledHeader>
  )
}

export function FilterableTableHeader({
  filterKey: key,
  label,
  options,
  filters,
  tooltip,
}: {
  filterKey: string
  label: string
  options: string[] | Record<string, string>
  filters: FiltersState
  tooltip?: string
}) {
  const optionKeys = Array.isArray(options) ? options : Object.keys(options)
  const form = React.useRef<HTMLFormElement>(null)

  function handleChange() {
    if (!form.current) return
    const formData = new FormData(form.current)
    const entries = formData.getAll(key) as string[]
    filters.setFilter(key, entries)
  }

  function deselectAll() {
    filters.setFilter(key, [])
  }

  function selectAll() {
    filters.setFilter(key, optionKeys)
  }
  const state = filters.getState()
  const selectedOptions = state[key] as Set<string> | undefined

  return (
    <Box position="relative">
      <Popover
        placement="bottom left"
        renderTrigger={(props, ref, state) => {
          return (
            <Box ref={ref}>
              {tooltip ? (
                <Tooltip body={tooltip} {...props} style={{ display: 'block' }}>
                  <FilterButton forwardedAs="span" variant="body3">
                    {label}
                    <IconFilter color={selectedOptions?.size ? 'textSelected' : 'currentColor'} size="1em" />
                  </FilterButton>
                </Tooltip>
              ) : (
                <FilterButton forwardedAs="button" type="button" variant="body3" {...props}>
                  {label}
                  <IconFilter color={selectedOptions?.size ? 'textSelected' : 'currentColor'} size="1em" />
                </FilterButton>
              )}
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
                  {optionKeys.map((option, index) => {
                    const label = Array.isArray(options) ? option : options[option]
                    const checked = filters.hasFilter(key, option)

                    return (
                      <Checkbox
                        key={index}
                        name={key}
                        value={option}
                        onChange={handleChange}
                        checked={checked}
                        label={<Text variant="body3">{label}</Text>}
                        extendedClickArea
                      />
                    )
                  })}
                </Stack>

                <Divider color="textDisabled" />

                {selectedOptions?.size === optionKeys.length ? (
                  <QuickAction variant="body3" forwardedAs="button" type="button" onClick={() => deselectAll()}>
                    Deselect all
                  </QuickAction>
                ) : (
                  <QuickAction variant="body3" forwardedAs="button" type="button" onClick={() => selectAll()}>
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

const StyledHeader = styled(Text)`
  cursor: pointer;
  appearance: none;
  border: none;
  background: transparent;

  &:hover,
  &:focus-visible {
    cursor: pointer;
  }
`
