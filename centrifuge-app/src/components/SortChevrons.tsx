import { IconChevronDown, IconChevronUp, Stack } from '@centrifuge/fabric'

type Sorting = {
  isActive: boolean
  direction: string | null
}

export function SortChevrons({ sorting }: { sorting: Sorting }) {
  return (
    <Stack as="span" width="1em">
      <IconChevronUp
        size="1em"
        color={sorting.isActive && sorting.direction === 'asc' ? 'textSelected' : 'textSecondary'}
      />
      <IconChevronDown
        size="1em"
        color={sorting.isActive && sorting.direction === 'desc' ? 'textSelected' : 'textSecondary'}
        style={{ marginTop: '-.4em' }}
      />
    </Stack>
  )
}
