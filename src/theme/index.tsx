import { base } from 'grommet/themes';
import { deepMerge } from 'grommet/utils';
import { createGlobalStyle } from 'styled-components';
import { ReactNode } from 'react';
import { Grommet } from 'grommet';
import * as React from 'react';

export const GlobalStyle = createGlobalStyle`
  body {
    font-family: Montserrat;
  }
  
  a {
    text-decoration: none;
    :hover, :visited, :active {
      text-decoration: none;
      color: black;
    }
  }
`;

const theme = deepMerge(base, {
  global: {
    colors: {
      background: 'white',
      black: '#000000',
      brand: '#FFA91A',
      focus: '#FD6FFF',
      placeholder: '#cbcbcd',
      text: {
        dark: '#444444',
        light: '#444444',
      },
      bodyBackground: '#f9f9fa',
      border: {
        dark: '#e0e0e6',
        light: '#e0e0e6',
      },
    },
  },
  table: {
    header: {
      background: {
        color: "#e3e3e8"
      }
    }
  },
  button: {
    primary: {
      color: 'brand',
    },
    color: 'white',
    border: {
      radius: '5px',
      width: 0,
      color: 'transparent',
    },
    padding: {
      vertical: '2px',
      horizontal: '10px',
    },
    extend: props => {
      if (!props.primary) {
        return `
          background-color: #e3e3e8;
          color: #3b3d40
        `;
      }
    },
  },
  control: {
    border: {
      width: 0,
    },
  },
});

const UIKitTheme = ({ children }: { children: ReactNode }) => (
  <Grommet theme={theme} full>
    {children}
    <GlobalStyle />
  </Grommet>
);

export default UIKitTheme;
