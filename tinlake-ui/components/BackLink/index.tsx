import { LinkPrevious } from 'grommet-icons'
import { PoolLink } from '../PoolLink'

export const BackLink = (props: { href: string }) => (
  <PoolLink href={props.href}>
    <LinkPrevious style={{ cursor: 'pointer' }} />
  </PoolLink>
)
