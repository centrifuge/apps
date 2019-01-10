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

import { Contact } from '../../common/models/dto/contact';
import { Field, Form } from 'react-final-form';
import StyledTextInput from '../../components/StyledTextInput';
import { required } from '../../validators';

interface ContactsProps {
  contacts?: (Contact)[];
  refresh: () => void;
  createContact: (contact: Contact) => void;
}

interface ContactsState {
  newContact?: Contact;
}

export default class Contacts extends React.Component<
  ContactsProps,
  ContactsState
> {
  displayName = 'Contacts';

  state: ContactsState = {};

  renderRow(contact: Contact) {
    return (
      <TableRow>
        <TableCell>
          <Text>{contact.name}</Text>
        </TableCell>
        <TableCell>
          <Text>{contact.address}</Text>
        </TableCell>
        <TableCell>
          <Box direction="row" gap="small">
            <Edit />
            <More />
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

  onCreateNewContactSubmit = values => {
    const { name, address } = values;
    this.props.createContact({ name, address });
    this.setState({ newContact: undefined });
  };

  cancelCreate = () => {
    this.setState({ newContact: undefined });
  };

  renderNewContactRow = () => {
    return (
      <TableRow>
        <TableCell>
          <Field name="name" validate={required}>
            {({ input, meta }) => (
              <StyledTextInput
                labelInline
                input={input}
                meta={meta}
                label="Name"
                placeholder="Please enter the contact name"
              />
            )}
          </Field>
        </TableCell>
        <TableCell>
          <Field name="address" validate={required}>
            {({ input, meta }) => (
              <StyledTextInput
                labelInline
                input={input}
                meta={meta}
                label="ID"
                placeholder="Please enter the contact address"
              />
            )}
          </Field>
        </TableCell>
        <TableCell>
          <Box direction="row" gap="xsmall" justify="center">
            <Button type="submit" primary label="Add" />
            <Button onClick={this.cancelCreate} label="Cancel" />
          </Box>
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
          <Form
            onSubmit={this.onCreateNewContactSubmit}
            render={({ handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>
                        <Text>Name</Text>
                      </TableCell>
                      <TableCell>
                        <Text>Address</Text>
                      </TableCell>
                      <TableCell>
                        <Text>Actions</Text>
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {this.state.newContact && this.renderNewContactRow()}
                    {this.props.contacts &&
                      this.props.contacts.map(contact =>
                        this.renderRow(contact),
                      )}
                  </TableBody>
                </Table>
              </form>
            )}
          />
        </Box>
      </Box>
    );
  }
}
