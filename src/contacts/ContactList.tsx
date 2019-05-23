import React from 'react';
import {
  Anchor,
  Box,
  Button,
  FormField,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  TextInput,
} from 'grommet';
import { Add, Edit } from 'grommet-icons';
import { Link } from 'react-router-dom';

import { Contact } from '../common/models/contact';
import { Formik } from 'formik';

interface ContactsProps {
  contacts?: (Contact & { isEditing?: boolean })[];
  refresh: () => void;
  createContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
}

interface ContactsState {
  submitted:boolean
  newContact?: Contact;
  contacts: (Contact & { isEditing?: boolean })[];
}


//TODO break this down

export default class ContactList extends React.Component<ContactsProps,
  ContactsState> {
  displayName = 'Contacts';

  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
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
              <Anchor
                label={"Edit"}
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

          <Formik
            validate={values => {
              const errors = {};
              // Parse Values and do errors
              return errors;
            }}
            initialValues={contact}
            onSubmit={(values) => {
              this.onContactSave(values);
            }}
          >
            {
              ({
                 values,
                 errors,
                 handleChange,
                 handleSubmit,
                 setFieldValue,
               }) => (
                <form style={{ width: '100%' }}
                      onSubmit={event => {
                        event.preventDefault();
                        this.setState({ submitted: true });
                        handleSubmit();
                      }}
                >

                  <Box direction="row" align="start" fill gap="xsmall">
                    <Box fill>
                      <FormField
                        error={errors.name}
                      >
                        <TextInput
                          name="name"
                          value={values.name || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>
                    <Box fill>
                      <FormField
                        error={errors.password}
                      >
                        <TextInput
                          name="address"
                          value={values.address || ''}
                          onChange={handleChange}
                        />
                      </FormField>
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
              )
            }
          </Formik>
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
