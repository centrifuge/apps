import React from 'react';
import { Heading } from 'grommet';

export default class Invoices extends React.Component {
  static displayName: 'Invoices';

  render() {
    return (
      <div>
        <Heading level="3">Invoices</Heading>
      </div>
    );
  }
}
