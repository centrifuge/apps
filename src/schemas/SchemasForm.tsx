import React from 'react';
import { Formik } from 'formik';
import { Box, Button, FormField, Paragraph, TextArea } from 'grommet';
import * as Yup from 'yup';
import { Schema } from '../common/models/schema';

type Props = {
  selectedSchema: Schema;
  submitLabel: string;
  infoParagraph: string;
  readonly: boolean;
  onDiscard: () => void;
  onSubmit: (schema) => void;
}

type State = {
  submitted: boolean;
}

export default class SchemasForm extends React.Component<Props, State> {
  state = {
    submitted: false,
  };

  onSubmit = (schemaJsonString: string) => {
    const { selectedSchema } = this.props;
    this.props.onSubmit({
      _id: selectedSchema._id,
      ...JSON.parse(schemaJsonString),
    });
  };

  render() {
    const { submitted } = this.state;
    const { selectedSchema, infoParagraph, submitLabel, readonly } = this.props;
    const defaultValues = {
      json: Schema.toEditableJson(selectedSchema),
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
            // If selected schema has _id set we diff for changes
            // It can be considered in EditMode
            if (selectedSchema._id) {

              try {
                Schema.validateDiff(selectedSchema, test);
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
                  {infoParagraph && <Paragraph>
                    {infoParagraph}
                  </Paragraph>}

                    <FormField
                      error={errors!.json}
                    >
                       <TextArea
                         style={{
                           maxHeight:'492px',
                           height:'calc(100vh - 400px)',

                         }}
                         readOnly={readonly}
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
                    {!readonly && <Button
                      type="submit"
                      primary
                      label={submitLabel}
                    />}
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
