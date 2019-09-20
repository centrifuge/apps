import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

interface Props {
  [key: string]: any;
  text: string;
}

const Badge: FunctionComponent<Props> = (props) => {
  return <Container {...props}>{ props.text }</Container>;
};

const Container = styled.div`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 20px;
  border: 1px solid #808080;
  line-height: 12px;
  font-size: 12px;
  color: #808080;
`;

export default Badge;
