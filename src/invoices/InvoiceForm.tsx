import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, Heading, TextArea, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { Invoice } from '../common/models/invoice';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';
import { ConnectedSenderForm } from './invoice-form-partials/SenderForm';
import { ConnectedRecipientForm } from './invoice-form-partials/RecipientForm';
import { ConnectedShipToForm } from './invoice-form-partials/ShipToForm';
import { ConnectedRemitToForm } from './invoice-form-partials/RemitToForm';
import { ConnectedPaymentForm } from './invoice-form-partials/PaymentForm';
import { ConnectedCreditNoteForm } from './invoice-form-partials/CreditNoteForm';


type InvoiceFormProps = {
  onSubmit?: (invoice: Invoice) => void;
  contacts: LabelValuePair[];
  invoice: Invoice;
};

export default class InvoiceForm extends React.Component<InvoiceFormProps> {
  displayName = 'CreateEditInvoice';
  static defaultProps: InvoiceFormProps = {
    invoice: {},
    contacts: [],
  };

  state = { submitted: false };

  onSubmit = (values: Invoice) => {
    return this.props.onSubmit && this.props.onSubmit({ ...values });
  };


  render() {

    const { submitted } = this.state;
    const { invoice } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'xlarge';

    return (
      <Box pad={{ bottom: 'large' }}>
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
             }) => (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  this.setState({ submitted: true });
                  handleSubmit();
                }}
              >
                {/* Header */}
                {this.props.children}

                {/* Body */}
                <Box direction="column" gap={sectionGap}>
                  {/* Invoice number section */}
                  <Box>
                    <FormField
                      label="Invoice number"
                      error={errors!.number}
                    >
                      <TextInput
                        name="number"
                        value={values!.number}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>

                  {/*Sender and Recipient */}
                  <Box direction="row" gap={columnGap}>
                    <ConnectedSenderForm columnGap={columnGap} contacts={this.props.contacts}/>
                    <ConnectedRecipientForm columnGap={columnGap} contacts={this.props.contacts}/>
                  </Box>

                  {/*Ship to and Remit to */}
                  <Box direction="row" gap={columnGap}>
                    <ConnectedShipToForm columnGap={columnGap}/>
                    <ConnectedRemitToForm columnGap={columnGap}/>
                  </Box>

                  {/* Payment section */}
                  <Box gap={columnGap}>
                    <ConnectedPaymentForm columnGap={columnGap} contacts={this.props.contacts}/>
                  </Box>

                  {/* Credit note section */}
                  <Box direction="row" gap={columnGap}>
                    <ConnectedCreditNoteForm columnGap={columnGap}/>
                  </Box>

                  {/* Comments section */}
                  <Box>
                    <FormField
                      label="Comments"
                      error={errors!.comment}
                    >
                      <TextArea
                        name="comment"
                        value={values!.comment || ''}
                        onChange={handleChange}
                      />
                    </FormField>
                  </Box>
                </Box>
              </form>
            )
          }
        </Formik>
      </Box>
    );

  }
}


