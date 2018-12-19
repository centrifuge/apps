import React from 'react';
import { Add, Checkmark } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { Field, Form } from 'react-final-form';
import { Invoice } from '../../common/models/dto/invoice';
import StyledTextInput from '../../components/StyledTextInput';

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
                <Heading level="3">Create New Invoice</Heading>
                {this.renderButtons()}
              </Box>
              <Box>
                <Box direction="row" gap="small">
                  <Field name="number">
                    {({ input, meta }) => (
                      <StyledTextInput
                        input={input}
                        meta={meta}
                        label="Invoice number"
                        placeholder="Please enter invoice number"
                      />
                    )}
                  </Field>
                  <Field name="customer">
                    {({ input, meta }) => (
                      <StyledTextInput
                        input={input}
                        meta={meta}
                        label="Sender name"
                        placeholder="Please enter the sender name"
                      />
                    )}
                  </Field>
                </Box>
                <Box direction="row" gap="small">
                  <Field name="supplier">
                    {({ input, meta }) => (
                      <StyledTextInput
                        input={input}
                        meta={meta}
                        label="Recipient name"
                        placeholder="Please enter the recipient name"
                      />
                    )}
                  </Field>
                </Box>
                <Box justify="end" direction="row" margin="10px 0 0 0">
                  {this.renderButtons()}
                </Box>
              </Box>
            </form>
          </Box>
        )}
      />
    );
  }
}
