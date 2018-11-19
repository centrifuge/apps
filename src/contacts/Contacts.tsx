import React from 'react';
import { Heading } from 'grommet';

export default class Contacts extends React.Component {
  static displayName: 'Contacts';

  render() {
    return (
      <div>
        <Heading level="3">Contacts</Heading>
      </div>
    );
  }
}
