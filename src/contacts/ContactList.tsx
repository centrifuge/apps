import React from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import { Contact } from '../common/models/contact';
import { Field, Form } from 'react-final-form';
import StyledTextInput from '../components/StyledTextInput';
import { required } from '../common/validators';

interface ContactsProps {
  contacts?: (Contact & { isEditing?: boolean })[];
  refresh: () => void;
  createContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
}

interface ContactsState {
  newContact?: Contact;
  contacts: (Contact & { isEditing?: boolean })[];
}

export default class ContactList extends React.Component<
  ContactsProps,
  ContactsState
> {
  displayName = 'Contacts';

  constructor(props) {
    super(props);
    this.state = {
      contacts: props.contacts ? [...props.contacts] : [],
    };
  }

  renderRow(contact: Contact) {
    return (
      <TableRow key={contact.address}>
        <TableCell>
          <Box direction="row" fill gap="xsmall">
            <Box fill>
              <Text>{contact.name}</Text>
            </Box>
            <Box fill>
              <Text>{contact.address}</Text>
            </Box>
            <Box fill direction="row" gap="small">
              <Edit
                onClick={() => {
                  // @ts-ignore
                  contact.isEditing = true;
                  this.setState({ contacts: this.state.contacts });
                }}
              />
            </Box>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  onAddNewClick = () => {
    this.setState({
      newContact: {},
    });
  };

  onContactSave = values => {
    const { name, address, _id } = values;
    if (_id) {
      this.props.updateContact({ name, address, _id });
      const contactsUpdated = this.state.contacts.map(contact => {
        if (_id === contact._id) {
          contact.isEditing = false;
        }

        return contact;
      });

      this.setState({ contacts: contactsUpdated });
    } else {
      this.props.createContact({ name, address });
      this.setState({ newContact: undefined });
    }
  };

  renderCreateEditRow = (contact?) => {
    return (
      <TableRow>
        <TableCell>
          <Form
            onSubmit={this.onContactSave}
            initialValues={contact}
            render={({ handleSubmit }) => (
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Box direction="row" align="start" fill gap="xsmall">
                  <Box fill>
                    <Field name="name" validate={required}>
                      {({ input, meta }) => (
                        <StyledTextInput
                          labelInline
                          input={input}
                          meta={meta}
                          placeholder="Please enter the contact name"
                        />
                      )}
                    </Field>
                  </Box>
                  <Box fill>
                    <Field name="address" validate={required}>
                      {({ input, meta }) => (
                        <StyledTextInput
                          labelInline
                          input={input}
                          meta={meta}
                          placeholder="Please enter the contact address"
                        />
                      )}
                    </Field>
                  </Box>
                  <Box
                    fill
                    direction="row"
                    gap="xsmall"
                    justify="start"
                    align="center"
                  >
                    <Box>
                      <Button
                        type="submit"
                        primary
                        label={contact ? 'Update' : 'Add'}
                      />
                    </Box>
                    <Box>
                      <Button
                        onClick={() => {
                          if (contact) {
                            contact.isEditing = false;
                            this.setState({ contacts: this.state.contacts });
                          } else {
                            this.setState({ newContact: undefined });
                          }
                        }}
                        label="Cancel"
                      />
                    </Box>
                  </Box>
                </Box>
              </form>
            )}
          />
        </TableCell>
      </TableRow>
    );
  };

  render() {
    return (
      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Contacts</Heading>
          <Button
            icon={<Add color="white" size="small" />}
            primary
            onClick={this.onAddNewClick}
            label="Add new"
            disabled={!!this.state.newContact}
          />
        </Box>

        <Box>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>
                  <Box fill direction="row" gap="xsmall">
                    <Box fill>
                      <Text>Name</Text>
                    </Box>
                    <Box fill>
                      <Text>Address</Text>
                    </Box>
                    <Box fill>
                      <Text>Actions</Text>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {this.state.newContact && this.renderCreateEditRow()}
              {this.state.contacts.map(contact =>
                contact.isEditing
                  ? this.renderCreateEditRow(contact)
                  : this.renderRow(contact),
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    );
  }
}
