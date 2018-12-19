import React from 'react';
import { Add, Checkmark } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { Field, Form } from 'react-final-form';
import { Contact } from '../../common/models/dto/contact';
import StyledTextInput from '../../components/StyledTextInput';

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

  private renderButtons() {
    return (
      <Box direction="row" gap="small" height="30px">
        <Button
          icon={<Checkmark color="white" size="12px" />}
          type="submit"
          primary
          label="Save"
        />
        <Button onClick={this.props.onCancel} label="Discard" />
      </Box>
    );
  }

  render() {
    return (
      <Form
        onSubmit={this.onSubmit}
        render={({ handleSubmit }) => (
          <Box fill="true">
            <form onSubmit={handleSubmit}>
              <Box justify="between" direction="row" align="center">
                <Heading level="3">Create New Contact</Heading>
                {this.renderButtons()}
              </Box>
              <Box>
                <Box direction="row" gap="small">
                  <Field name="name">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <StyledTextInput
                          input={input}
                          meta={meta}
                          label="Name"
                          placeholder="Please enter the contact name"
                        />
                      </Box>
                    )}
                  </Field>
                  <Field name="address">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <StyledTextInput
                          input={input}
                          meta={meta}
                          label="Address"
                          placeholder="Please enter the contact address"
                        />
                      </Box>
                    )}
                  </Field>
                </Box>
              </Box>
            </form>
          </Box>
        )}
      />
    );
  }
}
