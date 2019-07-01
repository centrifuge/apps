import styled from 'styled-components';
import { Box } from 'grommet';

interface Props {
  type: 'error' | 'success';
  children: React.ReactNode;
  [key: string]: any;
}

function Alert({ type, children, ...rest }: Props) {
  console.log({ rest });
  return <AlertContainer type={type} {...rest}>{children}</AlertContainer>;
}

const colors = {
  error: {
    backgroundColor: '#fed7d7',
    color: '#9b2c2c',
  },
  success: {
    backgroundColor: '#c6f6d5',
    color: '#276749',
  },
};

// tslint:disable-next-line:variable-name
const AlertContainer = styled(Box)<{ type: 'error' | 'success' }>`
  padding: 24px;
  background-color: ${p => colors[p.type].backgroundColor};
  color: ${p => colors[p.type].color};
  border-radius: 18px;
`;

export default Alert;
