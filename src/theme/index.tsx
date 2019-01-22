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
    
    color: black;
    
    :hover, :visited, :active {
      text-decoration: none;
      color: black;
    }
  }
  
  // fixes for FF and Edge
  table {
    width: 100%;
    tr {
      height: initial !important;
      
      th {
        height: initial !important;
      }
      
      td {
        height: initial !important;
      }
    }
  }
`;

const theme = deepMerge(base, {
  global: {
    colors: {
      background: '#F9F9FA',
      black: '#000000',
      brand: '#FFA91A',
      focus: 'brand',
      placeholder: '#CBCBCD',
      text: {
        dark: '#444444',
        light: '#444444',
      },
      bodyBackground: '#F9F9FA',
      border: {
        dark: '#E0E0E6',
        light: '#E0E0E6',
      }
    },
    input: {
      weight: 400,
    },
    font: {
      size: '14px',
    }
  },
  table: {
    header: {
      background: {
        color: '#E3E3E8',
      },
    },
  },
  anchor: {
    color: 'black',
    fontWeight: 'normal',
    hover: false
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
      vertical: '4px',
      horizontal: '10px',
    },
    extend: props => {
      if (!props.primary && !props.active) {
        return `
          background-color: #E3E3E8;
          color: #3B3D40
        `;
      }
    },
  },
  control: {
    border: {
      width: 0,
    },
  },
  select: {
    background: 'white',
  },
});

const UIKitTheme = ({ children }: { children: ReactNode }) => (
  <Grommet theme={theme} full>
    {children}
    <GlobalStyle />
  </Grommet>
);

export default UIKitTheme;
