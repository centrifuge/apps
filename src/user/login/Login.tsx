import React from 'react';
import { Box, Button, Text, TextInput } from 'grommet';
import { Field, Form } from 'react-final-form';
import { User } from '../../common/models/dto/user';

interface LoginProps {
  onSubmit: (values: any) => void;
}

class Login extends React.Component<LoginProps> {
  onSubmit = values => {
    this.props.onSubmit(values as User);
  };

  render() {
    return (
      <Form
        onSubmit={this.onSubmit}
        initialValues={{ username: 'test', password: 'test' }}
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
                <Box>
                  <Field name="username">
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
                  <Field name="password">
                    {({ input, meta }) => (
                      <Box fill>
                        <label>Password</label>
                        <TextInput
                          {...input}
                          placeholder="Please enter your password"
                        />
                        {meta.error && meta.touched && (
                          <span>{meta.error}</span>
                        )}
                      </Box>
                    )}
                  </Field>
                  <Box justify="between" direction="row">
                    <Text>username: test, password: test</Text>
                  </Box>
                  <Box direction="row" fill>
                    <Button type="submit" primary label="Login" fill={true} />
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

export default Login;
