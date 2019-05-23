import React, { Component } from 'react';
import styled from 'styled-components';
import { FormField, FormFieldProps, Paragraph } from 'grommet';

export class FormFieldWrapper extends Component<FormFieldProps & {value:string}> {
  render(): React.ReactNode {
    const { value, ...rest } = this.props;
    return <FormField {...rest}>
      <Paragraph margin="none">
        {value}
      </Paragraph>
    </FormField>;
  }
}

export const DisplayField = styled(FormFieldWrapper)`
  // Change the border color to a lighter gray
   & > div {
    padding: 2px 0px;
    // Force height on display field when value is empty
    >p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    > p:after {
      content: '';
      display: inline-block;
    }
    border-color: ${props => props.theme.global.colors['light-4']};
  }
`;
