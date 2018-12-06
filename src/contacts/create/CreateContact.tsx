import React from 'react';
import { Add } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading, TextInput } from 'grommet';
import { Field, Form } from 'react-final-form';
import { Contact } from '../../common/models/dto/contact';

type CreateContactProps = {
  onSubmit: (contact: Contact) => void;
  onCancel: () => void;
};
export default class CreateContact extends React.Component<CreateContactProps> {
  displayName = 'CreateContact';

  onSubmit = values => {
    const { name, address } = values;
    const contact = new Contact(name, address);
    return this.props.onSubmit(contact);
  };

  render() {
    return (
      <Form
        onSubmit={this.onSubmit}
        render={({ handleSubmit }) => (
          <Box fill="true">
            <form onSubmit={handleSubmit}>
              <Box justify="between" direction="row">
                <Heading level="3">Create New Contact</Heading>
                <Box direction="row" gap="small">
                  <Button type="submit">Save</Button>
                  <Button onClick={this.props.onCancel}>Cancel</Button>
                </Box>
              </Box>
              <Box>
                <Box direction="row" gap="small">
                  <Field name="name">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <label>Name</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter the contact name"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                  <Field name="address">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <label>Address</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter the contact address"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                </Box>
                <Box direction="row" gap="small" justify="end">
                  <Button type="submit">Save</Button>
                  <Button onClick={this.props.onCancel}>Cancel</Button>
                </Box>
              </Box>
            </form>
          </Box>
        )}
      />
    );
  }
}
