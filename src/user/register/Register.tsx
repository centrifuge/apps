import React from 'react';
import { Field, Form } from 'react-final-form';
import { Link } from 'react-router-dom';
import { Box, Button, Text, TextInput } from 'grommet';
import { User } from '../../common/models/user';
import routes from '../routes';
import { required } from '../../validators';

interface RegisterProps {
  onSubmit: (values: any) => void;
}

class Register extends React.Component<RegisterProps> {
  onSubmit = values => {
    this.props.onSubmit(values as User);
  };

  render() {
    return (
      <Form
        onSubmit={this.onSubmit}
        render={({ handleSubmit }) => (
          <Box align="center" justify="center">
            <Box
              width="medium"
              background="white"
              border="all"
              margin="medium"
              pad="medium"
            >
              <form onSubmit={handleSubmit}>
                <Box gap="small">
                  <Field name="username" validate={required}>
                    {({ input, meta }) => (
                      <Box fill>
                        <label>Username</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter your username"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                  <Field name="password" validate={required}>
                    {({ input, meta }) => (
                      <Box fill>
                        <label>Password</label>
                        <TextInput
                          {...input}
                          type="password"
                          placeholder="Please enter your password"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                  <Text>
                    Already registered?{' '}
                    <Link to={routes.index}>Log in</Link>
                  </Text>
                  <Box direction="row" height="50px">
                    <Button
                      type="submit"
                      primary
                      label="Register"
                      fill={true}
                    />
                  </Box>
                </Box>
              </form>
            </Box>
          </Box>
        )}
      />
    );
  }
}

export default Register;
