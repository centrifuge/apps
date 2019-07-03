import React, { Component } from 'react';
import styled from 'styled-components';
import { Anchor, Box, FormField, FormFieldProps, Paragraph } from 'grommet';
import { Share } from 'grommet-icons';

export class FormFieldWrapper extends Component<FormFieldProps & { value: string,linkTo:string }> {
  render(): React.ReactNode {
    const { value, linkTo, ...rest } = this.props;
    return <FormField {...rest}>
      <Box direction="row" gap={"small"} >
        <Paragraph margin="none">
          { value}

        </Paragraph>
        {linkTo && <Anchor href={linkTo} target={'_blank'}><Share size={'small'}/></Anchor>}
      </Box>

    </FormField>;
  }
}

export const DisplayField = styled(FormFieldWrapper)`
  // Change the border color to a lighter gray
   
   & > div {
    padding: 2px 0px;
    // Force height on display field when value is empty
    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    
    a {
    text-decoration: none;
    }
    
     p:after {
      content: '';
      display: inline-block;
    }
    border-color: ${props => props.theme.global.colors['light-4']};
  }
`;
