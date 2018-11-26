import React from 'react';
import { Add } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading, TextInput } from 'grommet';
import { Field, Form } from 'react-final-form';
import { Invoice } from '../../common/models/dto/invoice';

type CreateInvoiceProps = {
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
};
export default class CreateInvoice extends React.Component<CreateInvoiceProps> {
  displayName = 'CreateInvoice';

  onSubmit = values => {
    const { number, supplier, customer } = values;
    const status = 'CREATED';
    const invoice = new Invoice(number, supplier, customer, status);
    return this.props.onSubmit(invoice);
  };

  render() {
    return (
      <Form
        onSubmit={this.onSubmit}
        render={({ handleSubmit }) => (
          <Box fill="true">
            <form onSubmit={handleSubmit}>
              <Box justify="between" direction="row">
                <Heading level="3">Create New Invoice</Heading>
                <Box direction="row" gap="small">
                  <Button type="submit">Save</Button>
                  <Button onClick={this.props.onCancel}>Cancel</Button>
                </Box>
              </Box>
              <Box>
                <Box direction="row" gap="small">
                  <Field name="number">
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
                  <Field name="customer">
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
                <Box direction="row" gap="small">
                  <Field name="supplier">
                    {({ input, meta }) => (
                      <Box fill="true">
                        <label>Recipient name</label>
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
