import React from 'react';
import { Link } from 'react-router-dom';
import { FormField, TextInput,Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';

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

    } = this.props.formik;
    const {
      columnGap,
    } = this.props;

    return (
      <>
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
                onChange={handleChange}
              />
            </FormField>
          </Box>


        </Box>
      </>
    );

  }
}

export const ConnectedCreditNoteForm =  connect<CreditNoteFormProps,Invoice>(CreditNoteForm);


