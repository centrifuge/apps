import React from 'react';
import { Checkmark } from 'grommet-icons';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, Heading, TextInput } from 'grommet';
import { Invoice } from '../common/models/invoice';
import SearchSelect from '../components/form/SearchSelect';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';

type InvoiceFormProps = {
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
  contacts: LabelValuePair[];
  invoice?: Invoice;
};

export default class InvoiceForm extends React.Component<InvoiceFormProps> {
  displayName = 'CreateEditInvoice';

  state = { submitted: false };

  onSubmit = (values: Invoice) => {
    return this.props.onSubmit({ ...values });
  };

  private renderButtons() {
    return (
      <Box direction="row" gap="small">
        <Button
          icon={<Checkmark color="white" size="small"/>}
          type="submit"
          primary
          label="Save"
        />
        <Button active={false} onClick={this.props.onCancel} label="Discard"/>
      </Box>
    );
  }

  render() {

    const { submitted } = this.state;
    const { invoice } = this.props;

    return (
      <Formik
        validate={values => {
          const errors = {};
          // Parse Values and do errors
          return errors;
        }}
        initialValues={invoice}
        validateOnBlur={submitted}
        validateOnChange={submitted}
        onSubmit={(values, { setSubmitting }) => {
          this.onSubmit(values);
          setSubmitting(true);
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
            <form
              onSubmit={event => {
                event.preventDefault();
                this.setState({ submitted: true });
                handleSubmit();
              }}
            >


              <Box justify="between" direction="row" align="center">
                <Heading level="3">
                  {this.props.invoice ? 'Update Invoice' : 'Create New Invoice'}
                </Heading>
                {this.renderButtons()}
              </Box>


              <Box>
                <Box direction="column" gap="small">
                  {/* Invoice number section */}
                  <Box pad="medium">
                    <FormField
                      label="Invoice number"
                      error={errors.invoice_number}
                    >
                      <TextInput
                        name="invoice_number"
                        value={values.invoice_number || ''}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>

                  {/* Sender section */}
                  <Box pad="medium" gap="small">
                    <Box direction="row" gap="small" responsiveChildren>

                      <FormField
                        label="Sender"
                        error={errors.sender}
                      >
                        <SearchSelect
                          onChange={handleChange}
                          items={this.props.contacts}
                          selected={
                            this.props.invoice &&
                            this.props.contacts.find(
                              contact =>
                                contact.value === this.props.invoice!.sender,
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label="Sender name"
                        error={errors.sender_name}
                      >
                        <TextInput
                          name="sender_name"
                          value={values.sender_name || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                    <Box direction="row" gap="small" responsiveChildren>
                      <FormField
                        label="Sender street"
                        error={errors.sender_street}
                      >
                        <TextInput
                          name="sender_street"
                          value={values.sender_street || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Sender country"
                        error={errors.sender_country}
                      >
                        <TextInput
                          name="sender_country"
                          value={values.sender_country || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>
                    <Box direction="row" gap="small" responsiveChildren>
                      <FormField
                        label="Sender city"
                        error={errors.sender_city}
                      >
                        <TextInput
                          name="sender_city"
                          value={values.sender_city || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Sender ZIP code"
                        error={errors.sender_zipcode}
                      >
                        <TextInput
                          name="sender_zipcode"
                          value={values.sender_zipcode || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                  </Box>

                  {/* Recipient section */}
                  <Box pad="medium" gap="small">
                    <Box direction="row" gap="small" responsiveChildren>

                      <FormField
                        label="Recipient"
                        error={errors.recipient}
                      >
                        <SearchSelect
                          onChange={handleChange}
                          items={this.props.contacts}
                          selected={
                            this.props.invoice &&
                            this.props.contacts.find(
                              contact =>
                                contact.value ===
                                this.props.invoice!.recipient,
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label="Recipient Name"
                        error={errors.recipient_name}
                      >
                        <TextInput
                          name="recipient_name"
                          value={values.recipient_name || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                    <Box direction="row" gap="small" responsiveChildren>
                      <FormField
                        label="Recipient street"
                        error={errors.recipient_street}
                      >
                        <TextInput
                          name="recipient_street"
                          value={values.recipient_street || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Recipient country"
                        error={errors.recipient_country}
                      >
                        <TextInput
                          name="recipient_country"
                          value={values.recipient_country || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>
                    <Box direction="row" gap="small" responsiveChildren>
                      <FormField
                        label="Recipient city"
                        error={errors.recipient_city}
                      >
                        <TextInput
                          name="recipient_city"
                          value={values.recipient_city || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Recipient ZIP code"
                        error={errors.recipient_zipcode}
                      >
                        <TextInput
                          name="recipient_zipcode"
                          value={values.recipient_zipcode || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                  </Box>

                  {/* Payment section */}
                  <Box pad="medium" gap="small">
                    <Box direction="row" gap="small" responsiveChildren>
                      <FormField
                        label="Currency"
                        error={errors.currency}
                      >
                        <TextInput
                          name="currency"
                          value={values.currency || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Gross amount"
                        error={errors.gross_amount}
                      >
                        <TextInput
                          name="currency"
                          value={values.gross_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Net amount"
                        error={errors.net_amount}
                      >
                        <TextInput
                          name="net_amount"
                          value={values.net_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Net amount"
                        error={errors.net_amount}
                      >
                        <TextInput
                          name="net_amount"
                          value={values.net_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Tax amount"
                        error={errors.tax_amount}
                      >
                        <TextInput
                          name="tax_amount"
                          value={values.tax_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Tax rate"
                        error={errors.tax_rate}
                      >
                        <TextInput
                          name="tax_rate"
                          value={values.tax_rate || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>
                    <Box direction="row" gap="small" responsiveChildren>


                      <FormField
                        label="Payee"
                        error={errors.payee}
                      >
                        <SearchSelect
                          onChange={handleChange}
                          items={this.props.contacts}
                          selected={
                            this.props.invoice &&
                            this.props.contacts.find(
                              contact =>
                                contact.value === this.props.invoice!.payee,
                            )
                          }
                        />
                      </FormField>


                      <FormField
                        label="Due date"
                        error={errors.due_date}
                      >
                        <TextInput
                          name="due_date"
                          type="date"
                          value={values.due_date || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                      <FormField
                        label="Due created"
                        error={errors.date_created}
                      >
                        <TextInput
                          name="date_created"
                          type="date"
                          value={values.date_created || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                  </Box>

                  {/* Comments section */}
                  <Box pad="medium">
                    <FormField
                      label="Comments"
                      error={errors.comment}
                    >
                      <TextInput
                        name="comment"
                        value={values.comment || ''}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>
                </Box>
                <Box justify="end" direction="row" margin={{ top: 'small' }}>
                  {this.renderButtons()}
                </Box>
              </Box>
            </form>
          )
        }
      </Formik>);

  }
}
