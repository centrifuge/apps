import React from 'react';
import { Formik } from 'formik';
import { Box, Button, FormField, Paragraph, TextArea } from 'grommet';
import * as Yup from 'yup';
import { Schema } from '../../common/models/schema';

interface SchemasProps {
  selectedSchema: any;
  onDiscard: () => void;
  onSubmit: (schema) => void;
  isEditing: boolean;
}

interface SchemasState {
  submitted: boolean;
}

const editingLabel = 'Please note that only edits to the registries will be saved. Any changes to the name or attributes of a schema will be discarded.';
const creatingLabel = 'Please note that the schema must be a valid JSON object.';
const updateLabel = 'Update';
const createLabel = 'Create';

export default class SchemasForm extends React.Component<SchemasProps, SchemasState> {
  state = {
    submitted: false,
  };

  onSubmit = async (input: Object) => {
    this.props.onSubmit(input);
  };

  render() {
    const { submitted } = this.state;
    const { selectedSchema, isEditing } = this.props;
    const defaultValues = {
      json: JSON.stringify(selectedSchema, null, 2),
    };

    const jsonValidation = Yup.object().shape({
      json: Yup.string()
        .required('Schema is required')
        .test({
          name: 'test-json',
          test: (function(this, value) {
            let test;
            try {
              test = JSON.parse(value);
            } catch (e) {
              return this.createError({ path: this.path, message: 'Schema is not a valid JSON object' });
            }

            try {
              Schema.validate(test);
            } catch (e) {
              return this.createError({ path: this.path, message: e.message });
            }

            if(isEditing) {

              try {
                Schema.validateDiff(selectedSchema,test);
              } catch (e) {
                return this.createError({ path: this.path, message: e.message });
              }
            }

            return true;
          }),
        }),
    });

    return (
      <Box pad={{ vertical: 'medium' }}>
        <Formik
          enableReinitialize={true}
          initialValues={defaultValues}
          validateOnBlur={submitted}
          validateOnChange={submitted}
          validationSchema={jsonValidation}
          onSubmit={async (values, { setSubmitting }) => {
            if (!values) return;
            await this.onSubmit(values.json);
            setSubmitting(true);
          }}
        >
          {
            ({
               values,
               errors,
               setValues,
               handleChange,
               handleSubmit,
             }) => (
              <form
                onSubmit={event => {
                  this.setState({ submitted: true });
                  handleSubmit(event);
                }}>

                <Box gap={'medium'}>
                  <Paragraph>
                    {isEditing ? editingLabel : creatingLabel}
                  </Paragraph>
                  <FormField
                    error={errors!.json}
                  >
                       <TextArea
                         rows={25}
                         spellCheck={false}
                         fill={true}
                         id={'json'}
                         resize={false}
                         defaultValue={values.json}
                         onChange={handleChange}
                       />
                  </FormField>

                  <Box direction="row" justify={'end'} gap={'medium'}>
                    <Button
                      label="Discard"
                      onClick={this.props.onDiscard}
                    />
                    <Button
                      type="submit"
                      primary
                      label={isEditing ? updateLabel : createLabel}
                    />
                  </Box>
                </Box>

              </form>
            )
          }
        </Formik>
      </Box>
    );
  }
}
