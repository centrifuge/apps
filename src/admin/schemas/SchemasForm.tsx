import React from 'react';
import { Formik } from 'formik';
import { Box, TextArea, Button, FormField } from 'grommet';
import * as Yup from 'yup';

interface SchemasProps {
  selectedSchema: any;
  onDiscard: () => void;
  onSubmit: (schema) => void;
  isEditing: boolean;
}

interface SchemasState {
  submitted: boolean;
}

const editingLabel = "Please note that only edits to the registries will be saved. Any changes to the name or attributes of a schema will be discarded.";
const creatingLabel = "Please note that the schema must be a valid JSON object.";
const updateLabel = "Update";
const createLabel = "Create";

export default class SchemasForm extends React.Component<SchemasProps, SchemasState> {
  state = {
    submitted: false
  };

  onSubmit = async (input: Object) => {
    this.props.onSubmit(input);
  };

  render() {

    const jsonValidation = Yup.object().shape({
      json: Yup.string()
          .required('Schema is required')
          .test({
            name: 'test-json',
            test: (function (this, value) {
              let test;
              try {
                test = JSON.parse(value)
              } catch (e) {
                return this.createError({path: this.path, message: 'Schema is not a valid JSON object'})
              }
              if (!test.registries) {
                return this.createError({ path: this.path, message: 'At least one registry for this schema  is required'})
              }
              if (!test.name) {
                return this.createError({ path: this.path, message: 'Schema name is required'})
              }
              if (!test.attributes) {
                return this.createError({ path: this.path, message: 'At least one attribute for this schema  is required'})
              }
              if (!test.attributes.find(i => i.name === 'reference_id')) {
                return this.createError({ path: this.path, message: 'reference_id field is required in the attributes definition'})
              }
              return true
            })
          })
    });

    const { submitted } = this.state;
    const { selectedSchema } = this.props;

    return (
        <Box fill={'vertical'} >
        <Formik
            enableReinitialize={true}
            initialValues={ selectedSchema }
            validateOnBlur={submitted}
            validateOnChange={submitted}
            validationSchema={jsonValidation}
            onSubmit={async (values, {setSubmitting}) => {
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
                      this.setState({submitted: true});
                      handleSubmit(event);
                    }}>
                  <Box fill={'vertical'}>
                    <Box margin={{vertical: 'medium'}}>
                      <FormField
                          component={TextArea}
                          pad={true}
                          label={ this.props.isEditing ? editingLabel : creatingLabel }
                          error={errors!.json}
                      >
                        <Box margin={{top: 'medium'}}>
                        <TextArea
                            rows={25}
                            spellCheck={false}
                            fill={true}
                            id={"json"}
                            resize={false}
                            defaultValue={values.json}
                            onChange={handleChange}
                        />
                        </Box>
                      </FormField>

                    </Box>
                    <Box direction="row" justify={'end'} gap={'medium'}>
                      <Button
                          label="Discard"
                          onClick={this.props.onDiscard}
                      />
                      <Button
                          type="submit"
                          primary
                          label={ this.props.isEditing ? updateLabel : createLabel }
                      />
                    </Box>
                  </Box>
                </form>
            )
          }
        </Formik>
        </Box>
    )
  }
}
