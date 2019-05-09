import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, FormField, Heading, TextArea, TextInput } from 'grommet';
import { Invoice } from '../common/models/invoice';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';
import { ConnectedSenderForm } from './invoice-form-partials/SenderForm';
import { ConnectedRecipientForm } from './invoice-form-partials/RecipientForm';
import { ConnectedShipToForm } from './invoice-form-partials/ShipToForm';
import { ConnectedRemitToForm } from './invoice-form-partials/RemitToForm';
import { ConnectedDetailsForm } from './invoice-form-partials/DetailsForm';
import { ConnectedCreditNoteForm } from './invoice-form-partials/CreditNoteForm';
import { Section } from '../components/Section';
import { ConnectedInvoiceTotalForm } from './invoice-form-partials/InvoiceTotalForm';
import * as Yup from 'yup'

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
    const sectionGap = 'medium';


    const invoiceValidation = Yup.object().shape({
      number: Yup.string()
        .max(40, 'Please enter no more than 20 characters')
        .required( 'This field is required'),
      sender: Yup.string()
        .required( 'This field is required'),
      recipient: Yup.string()
        .required( 'This field is required'),
      currency: Yup.string()
        .required( 'This field is required'),
      status: Yup.string()
        .required( 'This field is required'),
      date_created: Yup.date()
        .typeError('Wrong date format')
        .required( 'This field is required'),
      date_due: Yup.date()
        .typeError('Wrong date format')
        .required( 'This field is required'),
    });

    return (
      <Box pad={{ bottom: 'large' }}>
        <Formik
          validationSchema={invoiceValidation}
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
                  <Box direction="row">
                    <Box basis={'1/4'}>
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
                  </Box>

                  {/*Sender and Recipient */}
                  <Box direction="row" gap={columnGap} >
                    <Section headingLevel="5" title="Sender" basis={'1/2'} >
                      <ConnectedSenderForm columnGap={columnGap} contacts={this.props.contacts}/>
                    </Section>
                    <Section headingLevel="5" title="Recipient"  basis={'1/2'} >
                      <ConnectedRecipientForm columnGap={columnGap} contacts={this.props.contacts}/>
                    </Section>
                  </Box>

                  {/* Invoice details section */}
                  <Box gap={columnGap}>
                    <Section headingLevel="5" title="Details" >
                      <ConnectedDetailsForm columnGap={columnGap}/>
                    </Section>
                  </Box>

                  {/* Invoice Total section */}
                  <Box gap={columnGap}>
                    <Section headingLevel="5" title="Invoice Total" >
                      <ConnectedInvoiceTotalForm columnGap={columnGap}/>
                    </Section>
                  </Box>

                  {/*Ship to and Remit to */}
                  <Box direction="row" gap={columnGap}>
                    <Section headingLevel="5" title="Ship to" basis={'1/2'} collapsed={true} collapsibleLabel="Shipment was send to a third-party">
                      <ConnectedShipToForm columnGap={columnGap}/>
                    </Section>
                    <Section headingLevel="5" title="Remit to" basis={'1/2'} collapsed={true} collapsibleLabel="Pay this invoice to a third-party">
                      <ConnectedRemitToForm columnGap={columnGap}/>
                    </Section>
                  </Box>

                  {/* Credit note section */}
                  <Box direction="row" gap={columnGap}>
                    <Section headingLevel="5" title="Credit note" basis={'1/2'} collapsed={true} collapsibleLabel="invoice is credit">
                      <ConnectedCreditNoteForm columnGap={columnGap}/>
                    </Section>
                  </Box>

                  <Box direction="row" gap={columnGap} >
                    {/* Comments section */}
                    <Box basis={"1/2"}>
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
                </Box>
              </form>
            )
          }
        </Formik>
      </Box>
    );

  }
}


