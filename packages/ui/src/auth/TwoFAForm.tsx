import React from 'react';
import { Box, Button, FormField, Text, TextInput } from 'grommet';

import { TwoFaType, User } from '@centrifuge/gateway-lib/models/user';
import { Formik } from 'formik';

interface LoginProps {
  user: User;
  onSubmit: (values: any) => void;
  error?: Error;
}

class TwoFAForm extends React.Component<LoginProps> {
  onSubmit = values => {
    this.props.onSubmit(values as User);
  };

  render() {
    const { error, user } = this.props;

    const info =
      user.twoFAType === TwoFaType.APP
        ? 'Open Authy and paste in the generated code for Gateway'
        : 'We just sent you a message via email with your security code. Enter the code in the form above to verify your identity.';

    return (

          <Formik
            initialValues={user}
            validate={values => {
              const errors = {};
              // Parse Values and do errors
              return errors;
            }}
            onSubmit={values => {
              this.onSubmit(values);
            }}
          >
            {({ values, errors, handleChange, handleSubmit }) => (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  handleSubmit();
                }}
              >
                <Box gap="small">
                  <FormField
                    label="Security code"
                    info={info}
                    error={errors!.token}
                  >
                    <TextInput
                      name="token"
                      value={values.token || ''}
                      onChange={handleChange}
                    />
                  </FormField>

                  {error && (
                    <Text color={'status-error'}>Failed to validate code!</Text>
                  )}

                  <Box direction="row" height="50px">
                    <Button type="submit" primary label="Verify" fill={true} />
                  </Box>
                </Box>
              </form>
            )}
          </Formik>
    );
  }
}

export default TwoFAForm;
