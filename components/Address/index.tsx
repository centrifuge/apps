import { Clone } from 'grommet-icons';
import copyToClipBoard from '../../utils/copyToClipBoard';
import { formatAddress } from '../../utils/formatAddress';
import styled from 'styled-components';

interface Props {
  address: string;
  [key: string]: any;
}

function Address({ address, ...rest }: Props) {
  return <AddressContainer onClick={() => copyToClipBoard(address)}
    title={address} {...rest}>
    {formatAddress(address)}{' '}
    <Clone size={'small'} />
  </AddressContainer>;
}

// tslint:disable-next-line:variable-name
const AddressContainer = styled.a`
  cursor: copy;
`;

export default Address;
