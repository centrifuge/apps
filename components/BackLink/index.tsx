import { LinkPrevious } from 'grommet-icons';
import Link from 'next/link';

export const BackLink = (props : {href: string}) => (
  <Link href={props.href} >
    <LinkPrevious style={{ cursor: 'pointer' }}/>
  </Link>
  );