import styled from 'styled-components';
import { Box } from 'grommet';

interface Props {
  type: 'error' | 'info' | 'success';
  children: React.ReactNode;
  [key: string]: any;
}

function Alert({ type, children, ...rest }: Props) {
  return <AlertContainer type={type} {...rest}>{children}</AlertContainer>;
}

const colors = {
  error: {
    backgroundColor: '#fed7d7',
    color: '#9b2c2c'
  },
  info: {
    backgroundColor: '#bee3f8',
    color: '#2c5282'
  },
  success: {
    backgroundColor: '#c6f6d5',
    color: '#276749'
  }
};

const AlertContainer = styled(Box)<{ type: 'error' | 'success' }>`
  padding: 24px;
  background-color: ${p => colors[p.type].backgroundColor};
  color: ${p => colors[p.type].color};
  border-radius: 18px;
`;

export default Alert;
