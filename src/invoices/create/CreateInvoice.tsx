import React from 'react';
import { Add, Checkmark } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { Field, Form } from 'react-final-form';
import { Invoice } from '../../common/models/dto/invoice';
import SearchableDropdown from '../../components/form/SearchableDropdown';
import { LabelValuePair } from '../../interfaces';
import StyledTextInput from '../../components/StyledTextInput';

type CreateInvoiceProps = {
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
  contacts: LabelValuePair[];
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
      <Box direction="row" gap="small">
        <Button
          icon={<Checkmark color="white" size="small" />}
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
          <Box fill>
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
                  <Field
                    name="supplier"
                    items={this.props.contacts}
                    // @ts-ignore - necessary until https://github.com/final-form/react-final-form/issues/398 is fixed
                    render={({ input, meta, items }) => (
                      <Box>
                        <label htmlFor="supplier">Supplier</label>
                        <SearchableDropdown
                          input={input}
                          meta={meta}
                          items={items}
                        />
                      </Box>
                    )}
                  />
                </Box>
                <Box justify="end" direction="row" margin={{ top: 'small' }}>
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
