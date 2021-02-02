import React from 'react';
import { Box, Button, FormField, Text, TextInput } from 'grommet';

import { User } from '@centrifuge/gateway-lib/models/user';
import { Formik } from 'formik';

interface LoginProps {
  user: User;
  info?:string;
  onSubmit: (values: any) => void;
  error?: Error;
}

class TwoFAForm extends React.Component<LoginProps> {
  onSubmit = values => {
    this.props.onSubmit(values as User);
  };

  render() {
    const { error, user, info } = this.props;

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
              {info && <p>{info}</p>}
              <FormField
                label="Security code"
                info={'Enter generated security code for Gateway'}
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
                <Button type="submit" primary label={"Verify your security code"} fill={true} />
              </Box>
            </Box>
          </form>
        )}
      </Formik>
    );
  }
}

export default TwoFAForm;
