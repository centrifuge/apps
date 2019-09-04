import React from 'react';
import { Box, Button, FormField, TextInput } from 'grommet';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { getCurrencyFormat } from '../common/formaters';
import { NumberInput } from '@centrifuge/axis-number-input';

type TransferDetailsFormProps = {
  onSubmit: (transferDetails: any) => void;
  onDiscard: () => void;
  contacts: LabelValuePair[];
  transferDetails: any;
};

export default class TransferDetailsForm extends React.Component<TransferDetailsFormProps> {
  displayName = 'CreateEditInvoice';
  static defaultProps: TransferDetailsFormProps = {
    onSubmit: (transferDetails: any) => {
      // do nothing by default
    },
    onDiscard: () => {
      // do nothing by default
    },
    transferDetails: {},
    contacts: [],
  };

  state = { submitted: false };

  onSubmit = (values: any) => {
    return this.props.onSubmit({ ...values });
  };

  onDiscard = () => {
    this.props.onDiscard();
  };


  render() {

    const { submitted } = this.state;
    const { transferDetails} = this.props;
    const columnGap = 'medium';
    const sectionGap = 'large';

    const currencyParts = getCurrencyFormat('DAI');

    const transferDetailsValidation = Yup.object().shape({
      settlement_reference: Yup.string()
        .length(66, 'A transaction hash must have 66 characters')
        .matches(/^0x/, 'A transaction hash must start with 0x')
        .required('This field is required'),
      amount: Yup.number()
        .required('This field is required')
        .min(0.01, 'Amount cannot be 0'),


    });

    return (
      <Box width={'large'} pad={{ top: 'large', bottom: 'large' }}>
        <Formik
          validationSchema={transferDetailsValidation}
          initialValues={transferDetails}
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
               setFieldValue,
               handleSubmit,
             }) => {


              return (
                <form
                  onSubmit={event => {
                    this.setState({ submitted: true });
                    handleSubmit(event);
                  }}
                >
                  <Box direction="column" gap={sectionGap}>

                    <Box gap={columnGap}>
                      <FormField
                        label="Transaction hash"
                        error={errors!.settlement_reference}
                      >
                        <TextInput
                          name="settlement_reference"
                          value={values!.settlement_reference}
                          onChange={handleChange}
                        />
                      </FormField>

                    </Box>
                    <Box gap={columnGap}>
                      <Box direction="row" gap={columnGap}>
                        <Box basis={'1/2'} gap={columnGap}>
                          <FormField
                            label={`Transfer amount`}
                            error={errors!.amount}
                          >
                            <NumberInput
                              {...currencyParts}
                              name="amount"
                              value={values!.amount}
                              onChange={({value}) => {
                                setFieldValue('amount', value+'');
                              }}
                            />

                          </FormField>
                        </Box>
                        <Box basis={'1/2'} gap={columnGap}>

                        </Box>

                      </Box>

                    </Box>

                  </Box>
                  <Box direction="row" justify={'end'} gap="medium" margin={{ top: 'medium' }}>
                    <Button
                      onClick={this.onDiscard}
                      label="Discard"
                    />

                    <Button
                      type="submit"
                      primary
                      label="Record"
                    />
                  </Box>
                </form>
              );
            }
          }
        </Formik>
      </Box>
    );

  }
}


