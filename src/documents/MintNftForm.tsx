import React from 'react';
import { Box, Button, CheckBox, FormField, TextInput } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Registry } from '../common/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { isValidAddress } from 'ethereumjs-util';

type Props = {
  onSubmit: (data: MintNftFormData) => void;
  onDiscard: () => void;
  registries: Registry[];
};


export interface MintNftFormData {
  registry: Registry | undefined,
  deposit_address: string
  transfer: boolean
}
// TODO use function components here
export default class MintNftForm extends React.Component<Props> {
  static defaultProps: Props = {
    onSubmit: () => {
      // do nothing by default
    },
    onDiscard: () => {
      // do nothing by default
    },
    registries: [] as Registry[],
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
    const { registries } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'large';

    const formValidation = Yup.object().shape({
      registry: Yup.string()
        .required('This field is required'),
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
      registry: undefined,
      deposit_address: '',
      transfer: false,
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
                        label="Registry"
                        error={errors.registry}
                      >
                        <SearchSelect
                          labelKey={'label'}
                          valueKey={'address'}
                          options={registries}
                          value={values.registry}
                          onChange={(selected) => {
                            setFieldValue('registry', selected);
                          }}
                        />
                      </FormField>

                      <CheckBox
                        label={'Transfer to someone else?'}
                        name='transfer'
                        checked={values.transfer}
                        onChange={handleChange}
                      />

                      {
                        values.transfer && <FormField
                          label="Deposit adress"
                          error={errors.deposit_address}
                        >
                          <TextInput
                            name="deposit_address"
                            value={values!.deposit_address}
                            onChange={handleChange}
                          />
                        </FormField>
                      }
                    </Box>
                  </Box>

                  <Box direction="row" justify={'end'} gap="medium" margin={{ top: 'medium' }}>
                    <Button
                      onClick={this.onDiscard}
                      label="Discard"
                    />

                    <Button
                      onClick={()=>{
                        this.setState({submitted:true})
                        submitForm()
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


