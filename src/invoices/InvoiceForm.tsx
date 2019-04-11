import React from 'react';
import { Link } from 'react-router-dom';
import { Box as GroometBox, Button, FormField, Heading, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { Invoice } from '../common/models/invoice';
import SearchSelect from '../components/form/SearchSelect';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';
import { dateFormatter } from '../common/formaters';

type InvoiceFormProps = {
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
  contacts: LabelValuePair[];
  invoice?: Invoice;
};

const Box = GroometBox as any;

export default class InvoiceForm extends React.Component<InvoiceFormProps> {
  displayName = 'CreateEditInvoice';

  state = { submitted: false };

  onSubmit = (values: Invoice) => {
    return this.props.onSubmit({ ...values });
  };


  render() {

    const { submitted } = this.state;
    const { invoice } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'xlarge';

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
          if (!values) return;
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
              {/* Header */}
              <Box justify="between" direction="row" align="center">
                <Heading level="3">
                  {this.props.invoice ? 'Update Invoice' : 'New Invoice'}
                </Heading>
                <Box direction="row" gap={columnGap}>
                  <Button
                    type="submit"
                    primary
                    label="Send"
                  />
                  <Button active={false} onClick={this.props.onCancel} label="Discard"/>
                </Box>
              </Box>

              {/* Body */}
              <Box>
                <Box direction="column" gap={sectionGap}>
                  {/* Invoice number section */}
                  <Box>
                    <FormField
                      label="Invoice number"
                      error={errors!.invoice_number}
                    >
                      <TextInput
                        name="invoice_number"
                        value={values!.invoice_number || ''}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>

                  {/*Sender and Recipient */}
                  <Box direction="row" gap={columnGap} responsiveChildren>
                    {/* Sender section */}
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <Box gap={columnGap}>
                        <FormField
                          label="Centrifuge ID"
                          error={errors!.sender}
                        >
                          <SearchSelect
                            onChange={(value) => setFieldValue('sender', value)}
                            options={this.props.contacts}
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
                          label="Company name"
                          error={errors!.sender_company_name}
                        >
                          <TextInput
                            name="sender_company_name"
                            value={values!.sender_company_name || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                      </Box>
                      <Box gap={columnGap}>
                        <FormField
                          label="Street"
                          error={errors!.sender_street1}
                        >
                          <TextInput
                            name="sender_street1"
                            placeholder="Street name and number"
                            value={values!.sender_street1 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Street"
                          error={errors!.sender_street2}
                        >
                          <TextInput
                            name="sender_street2"
                            placeholder="Apartment, unit, office, etc"
                            value={values!.sender_street2 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="City"
                          error={errors!.sender_city}
                        >
                          <TextInput
                            name="sender_city"
                            placeholder="City or state"
                            value={values!.sender_city || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Country"
                          error={errors!.sender_country}
                        >
                          <TextInput
                            name="sender_country"
                            value={values!.sender_country || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="ZIP code"
                          error={errors!.sender_zipcode}
                        >
                          <TextInput
                            name="sender_zipcode"
                            value={values!.sender_zipcode || ''}
                            onChange={handleChange}
                          />
                        </FormField>

                      </Box>
                    </Box>
                    {/* Recipient section */}
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <Box gap={columnGap}>
                        <FormField
                          label="Centrifuge ID"
                          error={errors!.recipient}
                        >
                          <SearchSelect
                            onChange={(value) => setFieldValue('recipient', value)}
                            options={this.props.contacts}
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
                          label="Company name"
                          error={errors!.bill_to_company_name}
                        >
                          <TextInput
                            name="bill_to_company_name"
                            value={values!.bill_to_company_name || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                      </Box>
                      <Box gap={columnGap}>
                        <FormField
                          label="Street"
                          error={errors!.bill_to_street1}
                        >
                          <TextInput
                            name="bill_to_street1"
                            placeholder="Street name and number"
                            value={values!.bill_to_street1 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Street"
                          error={errors!.bill_to_street2}
                        >
                          <TextInput
                            name="bill_to_street2"
                            placeholder="Apartment, unit, office, etc"
                            value={values!.bill_to_street2 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="City"
                          error={errors!.bill_to_city}
                        >
                          <TextInput
                            name="bill_to_city"
                            placeholder="City or state"
                            value={values!.bill_to_city || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Country"
                          error={errors!.bill_to_country}
                        >
                          <TextInput
                            name="bill_to_country"
                            value={values!.bill_to_country || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="ZIP code"
                          error={errors!.bill_to_zipcode}
                        >
                          <TextInput
                            name="bill_to_zipcode"
                            value={values!.bill_to_zipcode || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                      </Box>
                    </Box>
                  </Box>

                  {/*Ship to and Remit to */}
                  <Box direction="row" gap={columnGap} responsiveChildren>
                    {/* Ship to section */}
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <Box direction="row" gap={columnGap} responsiveChildren>
                        <Box gap={columnGap}>
                          <FormField
                            label="Ship to company"
                            error={errors!.ship_to_company_name}
                          >
                            <TextInput
                              name="ship_to_company_name"
                              value={values!.ship_to_company_name || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                            label="Name"
                            error={errors!.ship_to_contact_person_name}
                          >
                            <TextInput
                              name="ship_to_contact_person_name"
                              value={values!.ship_to_contact_person_name || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                        </Box>
                        <Box gap={columnGap}>
                          <FormField
                            label="Street"
                            error={errors!.ship_ro_street1}
                          >
                            <TextInput
                              placeholder="Street name and number"
                              name="ship_ro_street1"
                              value={values!.ship_ro_street1 || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                            label="Street"
                            error={errors!.ship_ro_street2}
                          >
                            <TextInput
                              placeholder="Apartment, unit, office, etc"
                              name="ship_ro_street2"
                              value={values!.ship_ro_street2 || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                            label="City"
                            error={errors!.ship_ro_city}
                          >
                            <TextInput
                              name="ship_ro_city"
                              placeholder="City or state"
                              value={values!.ship_ro_city || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                            label="Country"
                            error={errors!.ship_ro_country}
                          >
                            <TextInput
                              name="ship_ro_country"
                              value={values!.ship_ro_country || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                          <FormField
                            label="ZIP code"
                            error={errors!.ship_ro_zipcode}
                          >
                            <TextInput
                              name="ship_ro_zipcode"
                              value={values!.ship_ro_zipcode || ''}
                              onChange={handleChange}
                            />
                          </FormField>
                        </Box>
                      </Box>
                    </Box>
                    {/* Remit section */}
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <Box gap={columnGap}>
                        <FormField
                          label="Remit to company"
                          error={errors!.remit_to_company_name}
                        >
                          <TextInput
                            name="remit_to_company_name"
                            value={values!.remit_to_company_name || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Name"
                          error={errors!.remit_to_contact_person_name}
                        >
                          <TextInput
                            name="remit_to_contact_person_name"
                            value={values!.remit_to_contact_person_name || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="VAT number"
                          error={errors!.remit_to_vat_number}
                        >
                          <TextInput
                            name="remit_to_vat_number"
                            value={values!.remit_to_vat_number || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Local tax ID"
                          error={errors!.remit_to_local_tax_id}
                        >
                          <TextInput
                            name="remit_to_local_tax_id"
                            value={values!.remit_to_local_tax_id || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Tax country"
                          error={errors!.remit_to_tax_country}
                        >
                          <TextInput
                            name="remit_to_tax_country"
                            value={values!.remit_to_tax_country || ''}
                            onChange={handleChange}
                          />
                        </FormField>

                      </Box>
                      <Box gap={columnGap}>
                        <FormField
                          label="Street"
                          error={errors!.remit_to_street1}
                        >
                          <TextInput
                            placeholder="Street name and number"
                            name="remit_to_street1"
                            value={values!.remit_to_street1 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Street"
                          error={errors!.remit_to_street2}
                        >
                          <TextInput
                            placeholder="Apartment, unit, office, etc"
                            name="remit_to_street2"
                            value={values!.remit_to_street2 || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="City"
                          error={errors!.remit_to_city}
                        >
                          <TextInput
                            name="remit_to_city"
                            placeholder="City or state"
                            value={values!.remit_to_city || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="Country"
                          error={errors!.remit_to_country}
                        >
                          <TextInput
                            name="remit_to_country"
                            value={values!.remit_to_country || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                        <FormField
                          label="ZIP code"
                          error={errors!.remit_to_zipcode}
                        >
                          <TextInput
                            name="remit_to_zipcode"
                            value={values!.remit_to_zipcode || ''}
                            onChange={handleChange}
                          />
                        </FormField>
                      </Box>
                    </Box>
                  </Box>

                  {/* Payment section */}
                  <Box gap={columnGap}>
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <FormField
                        label="Payee"
                        error={errors!.payee}
                      >
                        <SearchSelect
                          onChange={(value) => setFieldValue('payee', value)}
                          options={this.props.contacts}
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
                        label="Date created"
                        error={errors!.date_created}
                      >
                        <TextInput
                          name="date_created"
                          type="date"
                          value={dateFormatter(values!.date_created) || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Gross amount"
                        error={errors!.gross_amount}
                      >
                        <TextInput
                          name="currency"
                          value={values!.gross_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Tax amount"
                        error={errors!.tax_amount}
                      >
                        <TextInput
                          name="tax_amount"
                          value={values!.tax_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                    <Box direction="row" gap={columnGap} responsiveChildren>
                      <FormField
                        label="Currency"
                        error={errors!.currency}
                      >
                        <TextInput
                          name="currency"
                          value={values!.currency || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Due date"
                        error={errors!.due_date}
                      >
                        <TextInput
                          name="due_date"
                          type="date"
                          value={dateFormatter(values!.due_date) || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Net amount"
                        error={errors!.net_amount}
                      >
                        <TextInput
                          name="net_amount"
                          value={values!.net_amount || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Tax rate"
                        error={errors!.tax_rate}
                      >
                        <TextInput
                          name="tax_rate"
                          value={values!.tax_rate || ''}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>

                  </Box>

                  {/* Credit note section */}
                  <Box direction="row" gap={columnGap}>

                    <Box direction="row" basis={"1/2"} gap={columnGap} responsiveChildren>
                      <FormField
                        label="Original invoice number"
                        error={errors!.credit_note_invoice_number}
                      >
                        <TextInput
                          name="credit_note_invoice_number"
                          value={values!.credit_note_invoice_number || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                      <FormField
                        label="Original invoice date"
                        error={errors!.credit_for_invoice_date}
                      >
                        <TextInput
                          name="credit_for_invoice_date"
                          type="date"
                          value={dateFormatter(values!.credit_for_invoice_date) || ''}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>

                  </Box>

                  {/* Comments section */}
                  <Box>
                    <FormField
                      label="Comments"
                      error={errors!.comment}
                    >
                      <TextInput
                        name="comment"
                        value={values!.comment || ''}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>
                </Box>
              </Box>
            </form>
          )
        }
      </Formik>);

  }
}


