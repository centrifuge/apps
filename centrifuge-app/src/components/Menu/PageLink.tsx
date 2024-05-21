import { Text } from '@centrifuge/fabric'
import { useRouteMatch } from 'react-router'
import { Link, LinkProps } from 'react-router-dom'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { prefetchRoute } from '../Root'
import { baseButton, primaryButton } from './styles'

const Root = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  grid-template-columns: ${({ stacked, theme }) => (stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr`)};
`

type PageLinkProps = LinkProps & {
  stacked?: boolean
}

export function PageLink({ stacked = false, to, children }: PageLinkProps) {
  const match = useRouteMatch(to as string)
  const isMedium = useIsAboveBreakpoint('M')

  return (
    <Root
      forwardedAs={Link}
      to={to}
      variant="interactive1"
      isActive={Boolean(match)}
      stacked={stacked}
      onMouseOver={() => prefetchRoute(to)}
      isMedium={isMedium}
    >
      {children}
    </Root>
  )
}
