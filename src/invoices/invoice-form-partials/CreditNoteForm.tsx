import React from 'react';
import { Link } from 'react-router-dom';
import { FormField, TextInput,Box } from 'grommet';

import { connect, FormikContext } from 'formik';
import { dateFormatter } from '../../common/formaters';
import { Invoice, invoiceHasCreditNote } from '../../common/models/invoice';
import { parseDate } from '../../common/parsers';
import { Section } from '../../components/Section';

interface CreditNoteFormProps {
  columnGap: string;
};

interface ConnectedCreditNoteFormProps extends CreditNoteFormProps {
  formik: FormikContext<Invoice>;
};

export class CreditNoteForm extends React.Component<ConnectedCreditNoteFormProps> {
  displayName = 'CreditNoteForm';

  render() {
    const {
      errors,
      values,
      handleChange,
      setFieldValue
    } = this.props.formik;
    const {
      columnGap,
    } = this.props;

    // In edit mode if the invoice has credit_ props the section should not be collapsed
    const collapsed = !invoiceHasCreditNote(values);

    return (
      <Section headingLevel="5" title="Credit note" basis={'1/2'} collapsed={collapsed} collapsibleLabel="invoice is credit">
        <Box direction="row" basis={'1/2'} gap={columnGap} >
          <Box flex="grow">
            <FormField
              label="Original invoice number"
              error={errors!.credit_note_invoice_number}
            >
              <TextInput
                name="credit_note_invoice_number"
                value={values!.credit_note_invoice_number}
                onChange={handleChange}
              />
            </FormField>
          </Box>

          <Box flex="grow">
            <FormField
              label="Original invoice date"
              error={errors!.credit_for_invoice_date}
            >
              <TextInput
                name="credit_for_invoice_date"
                type="date"
                value={dateFormatter(values!.credit_for_invoice_date)}
                onChange={ ev => {
                  setFieldValue('credit_for_invoice_date',  parseDate(ev.target.value))
                }}
              />

            </FormField>
          </Box>


        </Box>
      </Section>
    );

  }
}

export const ConnectedCreditNoteForm =  connect<CreditNoteFormProps,Invoice>(CreditNoteForm);


