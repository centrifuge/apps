import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { IconChevronEnd, IconChevronLeft, IconChevronRight, IconChevronStart } from '../../icon'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'
import { usePaginationContext } from './PaginationContainer'
import { PaginationState } from './usePagination'

const StyledButton = styled.button<{
  $active?: boolean
}>(
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 3,
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-in-out',
    borderStyle: 'solid',
    userSelect: 'none',
  },
  ({ disabled, $active }) => {
    const bg = 'backgroundButtonTertiary'
    const bgFocus = 'backgroundButtonTertiaryFocus'
    const bgHover = 'backgroundButtonTertiaryHover'
    const bgPressed = 'backgroundButtonTertiaryPressed'
    const bgDisabled = 'backgroundButtonTertiaryDisabled'
    const fg = 'textButtonTertiary'
    const fgFocus = 'textButtonTertiaryFocus'
    const fgHover = 'textButtonTertiaryHover'
    const fgPressed = 'textButtonTertiaryPressed'
    const fgDisabled = 'textButtonTertiaryDisabled'
    const border = 'borderButtonTertiary'
    const borderFocus = 'borderButtonTertiaryFocus'
    const borderHover = 'borderButtonTertiaryHover'
    const borderPressed = 'borderButtonTertiaryPressed'
    const borderDisabled = 'borderButtonTertiaryDisabled'

    return css({
      paddingX: '2px',
      color: disabled ? fgDisabled : $active ? fgHover : fg,
      backgroundColor: disabled ? bgDisabled : $active ? bgHover : bg,
      borderColor: disabled ? borderDisabled : $active ? borderHover : border,
      borderWidth: 1,
      pointerEvents: disabled ? 'none' : 'initial',
      minHeight: 24,
      minWidth: 24,

      '&:hover': {
        color: fgHover,
        backgroundColor: bgHover,
        borderColor: borderHover,
      },
      '&:active': {
        color: fgPressed,
        backgroundColor: bgPressed,
        borderColor: borderPressed,
      },

      '&:focus-visible': {
        color: fgFocus,
        backgroundColor: bgFocus,
        borderColor: borderFocus,
      },
    })
  }
)

export function Pagination({ pagination }: { pagination?: PaginationState }) {
  const ctx = usePaginationContext()
  if (!pagination && !ctx)
    throw new Error('Pagination needs to be in a PaginationProvider or be passed the `pagination` prop')
  const { pageCount, page, goToPage, canPreviousPage, canNextPage, goToPrevious, goToNext, goToFirst, goToLast } =
    pagination || ctx

  let firstShown = Math.max(page - 2, 1)
  const lastShown = Math.min(firstShown + 4, pageCount)
  firstShown = Math.max(lastShown - 4, 1)
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).slice(firstShown - 1, lastShown)

  return (
    <Shelf gap="4px">
      <StyledButton
        onClick={() => goToFirst()}
        disabled={!canPreviousPage}
        aria-label="first page"
        style={{ visibility: firstShown > 1 ? 'visible' : 'hidden' }}
      >
        <Flex bleedX={1} bleedY={1}>
          <IconChevronStart />
        </Flex>
      </StyledButton>
      <StyledButton onClick={() => goToPrevious()} disabled={!canPreviousPage} aria-label="previous page">
        <Flex bleedX={1} bleedY={1}>
          <IconChevronLeft />
        </Flex>
      </StyledButton>
      {firstShown > 1 && (
        <Text variant="interactive1" style={{ userSelect: 'none' }}>
          …
        </Text>
      )}
      {pages.map((n) => (
        <StyledButton
          key={`pagr-nr-${n}`}
          onClick={() => goToPage(n)}
          $active={page === n}
          aria-label={`Go to page ${n}`}
        >
          <Text variant="interactive1" color="inherit">
            {n}
          </Text>
        </StyledButton>
      ))}
      {lastShown < pageCount && (
        <Text variant="interactive1" style={{ userSelect: 'none' }}>
          …
        </Text>
      )}
      <StyledButton onClick={() => goToNext()} disabled={!canNextPage} aria-label="next page">
        <Flex bleedX={1} bleedY={1}>
          <IconChevronRight />
        </Flex>
      </StyledButton>
      <StyledButton
        onClick={() => goToLast()}
        disabled={!canNextPage}
        aria-label="last page"
        style={{ visibility: lastShown < pageCount ? 'visible' : 'hidden' }}
      >
        <Flex bleedX={1} bleedY={1}>
          <IconChevronEnd />
        </Flex>
      </StyledButton>
    </Shelf>
  )
}
