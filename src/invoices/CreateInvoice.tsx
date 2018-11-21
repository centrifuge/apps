import React from 'react';
import { Add } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading, TextInput } from 'grommet';
import { Field, Form } from 'react-final-form';

export default class CreateInvoice extends React.Component {
  displayName = 'CreateInvoice';

  onFormSubmit(values) {
    console.log(values);
  }

  render() {
    return (
      <Form
        onSubmit={this.onFormSubmit}
        render={({ handleSubmit, values, reset }) => (
          <Box fill="true">
            <Box justify="between" direction="row">
              <Heading level="3">Create New Invoice</Heading>
              <Box direction="row" gap="small">
                <Button>Save</Button>
                <Button onClick={reset}>Cancel</Button>
              </Box>
            </Box>
            <Box>
              <form onSubmit={handleSubmit}>
                <Box direction="row" gap="small">
                  <Field name="invoiceNumber">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <label>Invoice number</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter invoice number"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                  <Field name="senderName">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <label>Sender name</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter the sender name"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                </Box>
              </form>
              <Box direction="row" gap="small" justify="end">
                <Button>Save</Button>
                <Button onClick={reset}>Cancel</Button>
              </Box>
            </Box>
          </Box>
        )}
      />
    );
  }
}
