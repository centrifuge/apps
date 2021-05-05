import React from 'react';
import { Box, Button, FormField, TextInput } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Registry } from '@centrifuge/gateway-lib/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { isValidAddress } from 'ethereumjs-util';
import { DisplayField } from '@centrifuge/axis-display-field';
import {getAddressLink} from "@centrifuge/gateway-lib/utils/etherscan";

type Props = {
  onSubmit: (data: MintNftFormData) => void;
  onDiscard: () => void;
  registries: Registry[];
};


export interface MintNftFormData {
  registry: Registry | undefined,
  deposit_address: string
}

// TODO use function components here
export default class MintNftForm extends React.Component<Props> {

  state = { submitted: false };

  onSubmit = (values: any) => {
    return this.props.onSubmit({ ...values });
  };

  onDiscard = () => {
    this.props.onDiscard();
  };

  render() {

    const { submitted } = this.state;
    const { registries } = this.props;

    const formValidation = Yup.object().shape({
      registry: Yup.object().shape({
        address: Yup.string()
          .required('This field is required')
      }),
      deposit_address: Yup.string()
        .test({
          name: 'test_schemas',
          test: (function(this, value) {
            if (this.parent.transfer) {
              if (!value)
                return this.createError({ path: this.path, message: 'This is field is required' });
              else {
                if (!isValidAddress(value))
                  return this.createError({ path: this.path, message: 'Not a valid account address' });
              }
            }
            return true;
          }),
        }),
    });

    const initialValues: MintNftFormData = {
      registry: {
        label: registries[0].label,
        address: registries[0].address,
        asset_manager_address: registries[0].asset_manager_address,
        oracle_address: registries[0].oracle_address,
        proofs: registries[0].proofs
      },
      deposit_address: '',
    };

    return (
      <Box pad={{ top: 'large', bottom: 'large' }}>
        <Formik
          validationSchema={formValidation}
          initialValues={initialValues}
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
               setFieldValue,
               submitForm,
             }) => {
              return (
                <>
                  <Box direction="column" gap="large">
                    <Box direction="row">
                      <Box>
                        <FormField
                            label="Registry"
                            error={errors!.registry ? (errors!.registry as any)!.address : ''}
                        >
                          <SearchSelect
                              name="registry"
                              labelKey={'label'}
                              valueKey={'address'}
                              options={registries}
                              value={values.registry}
                              onChange={(selected) => {
                                setFieldValue('registry', selected);
                              }}
                          />
                        </FormField>
                      </Box>
                      <Box margin={{top:'medium', left:'xlarge'}}>
                        <DisplayField
                            copy={true}
                            as={'span'}
                            link={{
                              href: getAddressLink(values!.registry!.address),
                              target: '_blank',
                            }}
                            value={values!.registry!.address}
                        />
                      </Box>
                    </Box>
                      <FormField
                          label="Deposit address"
                          error={errors.deposit_address}
                        >
                          <TextInput
                            name="deposit_address"
                            value={values!.deposit_address}
                            onChange={handleChange}
                          />
                        </FormField>
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
                      label="Mint"
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


