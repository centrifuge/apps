import React from 'react';
import { Box, Button, FormField, TextInput } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { CoreapiNFT } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { TransferNftRequest } from '@centrifuge/gateway-lib/models/nfts';

type Props = {
  onSubmit: (data: TransferNftRequest) => void;
  onDiscard: () => void;
  contacts: Contact[];
  nft: CoreapiNFT
};


export interface TransferNftFormData {
  to: string
}

// TODO use function components here
export default class TransferNftForm extends React.Component<Props> {

  state = { submitted: false };

  onSubmit = (values: any) => {
    return this.props.onSubmit({
      ...this.props.nft,
      ...values,
    });
  };

  onDiscard = () => {
    this.props.onDiscard();
  };

  render() {

    const { submitted } = this.state;
    const { contacts } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'large';

    const formValidation = Yup.object().shape({
      to: Yup.string()
        .matches(/^0x/, 'address must start with 0x')
        .length(42, 'address must have 42 characters')
        .required('This field is required'),
    });

    const initialValues: TransferNftFormData = {
      to: '',
    };

    return (
      <Box pad={{ top: 'large', bottom: 'large' }}>
        <Formik
          validationSchema={formValidation}
          initialValues={initialValues}
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
               submitForm,
             }) => {
              return (
                <>
                  <Box direction="column" gap={sectionGap}>

                    <Box gap={columnGap}>
                      <FormField
                        label="New owner address"
                        error={errors.to}
                      >
                        <TextInput
                          name="to"
                          value={values!.to}
                          suggestions={
                            contacts.map(c => {
                              return {
                                label: <Box align="start" pad="small">{c.name}</Box>,
                                value: c.address,
                              };
                            })}
                          onSelect={({ suggestion }) => {
                            setFieldValue('to', suggestion.value);
                          }}
                          onChange={handleChange}
                        />
                      </FormField>
                    </Box>
                  </Box>

                  <Box direction="row" justify={'end'} gap="medium" margin={{ top: 'medium' }}>
                    <Button
                      onClick={this.onDiscard}
                      label="Discard"
                    />

                    <Button
                      onClick={() => {
                        this.setState({ submitted: true });
                        submitForm();
                      }}
                      primary
                      label="Transfer"
                    />
                  </Box>
                </>
              );
            }
          }
        </Formik>
      </Box>
    );

  }
}


