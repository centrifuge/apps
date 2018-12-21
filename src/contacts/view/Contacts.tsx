import React from 'react';
import { Box, Button, DataTable, Heading } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import contactsRoutes from '../routes';
import { Contact } from '../../common/models/dto/contact';

// Casting to "any" until https://github.com/grommet/grommet/issues/2464 is fixed
const DataTableSupressedWarning = DataTable as any;

interface ContactsTableColumn {
  property: keyof Contact;
  header?: string;
  render?: (contactId: string) => JSX.Element;
}

const columns: ContactsTableColumn[] = [
  {
    property: 'name',
    header: 'Name',
  },
  {
    property: 'address',
    header: 'Address',
  },
  {
    property: '_id',
    render: (contactId: string) => (
      <Box direction="row" gap="small">
        <Edit />
        <More />
      </Box>
    ),
  },
];

type ContactsProps = { contacts: Contact[] };

export default class Contacts extends React.Component<ContactsProps> {
  displayName = 'Contacts';

  render() {
    return (
      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Contacts</Heading>
          <Link to={contactsRoutes.new}>
            <Button
              icon={<Add color="white" size="12px" />}
              primary
              label="Add new"
            />
          </Link>
        </Box>

        <Box>
          <DataTableSupressedWarning
            data={this.props.contacts}
            columns={columns}
          />
        </Box>
      </Box>
    );
  }
}
