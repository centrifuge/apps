import React from 'react';
import { Formik } from 'formik';
import { Box, TextArea, Button } from 'grommet';
import * as Yup from 'yup';
import { Schema } from "../../common/models/schema";

interface SchemasCreationProps {
  onDiscard: () => void;
  onSubmit: (schema) => void;
  schema: any
}

interface SchemasState {
  submitted: boolean;
  newSchema?: Schema;
}

export default class SchemasCreationForm extends React.Component<SchemasCreationProps, SchemasState> {
    state = { submitted: false };

    onSubmit = async (input: Object) => {
      this.props.onSubmit(input);
    };

  render() {

    const newSchemaValidation = Yup.object().shape({
    });

    const { submitted } = this.state;
    const { schema } = this.props;

    return (
        <Formik
            initialValues={schema}
            validateOnBlur={submitted}
            validateOnChange={submitted}
            validationSchema={newSchemaValidation}
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
               handleSubmit,
            }) => (
                <form
                    onSubmit={event => {
                      this.setState({ submitted: true });
                      handleSubmit(event);
                    }}
                >
                  <Box width={'large'} height={'large'}>

                    <Box fill={'vertical'} margin={{ vertical: 'medium' }}>
                        <TextArea
                          id={"json"}
                          resize={false}
                          fill={true}
                          onChange={handleChange}
                        />
                    </Box>
                    <Box direction="row" justify={'end'} gap={'medium'}>
                      <Button
                          label="Discard"
                          onClick={this.props.onDiscard}
                      />
                      <Button
                          type="submit"
                          primary
                          label="Create"
                      />
                    </Box>
                  </Box>
                </form>
            )
          }
        </Formik>
    )
  }
}

