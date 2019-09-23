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
import { Contact } from '../common/models/contact';
import { Formik } from 'formik';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { User } from '../common/models/user';

type Props =  {
  loggedInUser: User;
  contacts?: (Contact & { isEditing?: boolean })[];
  createContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
}

type State = {
  submitted: boolean
  newContact?: Contact;
  contacts: (Contact & { isEditing?: boolean })[];
}


//TODO This should contain only the list and the actions/modals should be view contacts

export default class ContactList extends React.Component<Props,
  State> {
  displayName = 'Contacts';

  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
      contacts: props.contacts ? [...props.contacts] : [],
    };
  }

  renderRow(contact: Contact) {
    const {loggedInUser} = this.props;
    return (
      <TableRow key={contact._id}>
        <TableCell>
          <Box direction="row" fill gap="xsmall">
            <Box fill>
              <Text>{contact.name}</Text>
            </Box>
            <Box fill>
              <Text>{contact.address}</Text>
            </Box>
            <Box fill direction="row" gap="small">
              {contact!.address!.toLowerCase() !== loggedInUser.account.toLowerCase() && <Anchor
                label={'Edit'}
                onClick={() => {
                  // @ts-ignore
                  contact.isEditing = true;
                  this.setState({ contacts: this.state.contacts });
                }}
              />}
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
        <SecondaryHeader>
          <Heading level="3">Contacts</Heading>
          <Button
            primary
            onClick={this.onAddNewClick}
            label="Add Contact"
            disabled={!!this.state.newContact}
          />
        </SecondaryHeader>

        <Box pad={{horizontal:"medium"}}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>
                  <Box fill direction="row" gap="xsmall">
                    <Box fill>
                      <Text weight={500}>Name</Text>
                    </Box>
                    <Box fill>
                      <Text weight={500}>Centrifuge ID</Text>
                    </Box>
                    <Box fill>
                      <Text weight={500}>Actions</Text>
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
