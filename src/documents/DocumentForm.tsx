import React from 'react';
import { Box, FormField, TextInput } from 'grommet';
import { LabelValuePair } from '../common/interfaces';
import { Formik } from 'formik';

import * as Yup from 'yup';
import { CoreapiDocumentResponse } from '../../clients/centrifuge-node';
import { Attribute, Schema } from '../common/models/schema';
import SearchSelect from '../components/form/SearchSelect';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { dateToString, extractDate } from '../common/formaters';

type Props = {
  onSubmit?: (document: CoreapiDocumentResponse) => void;
  contacts: LabelValuePair[];
  schemas: Schema[],
  mode?: 'edit' | 'view' | 'create',
  editMode?: boolean,
  document: CoreapiDocumentResponse;
};

type State = {
  submitted: boolean,
  selectedSchema: Schema
}


export class DocumentForm extends React.Component<Props, State> {

  static defaultProps: Props = {
    onSubmit: () => {
      // do nothing
    },
    schemas: [],
    mode: 'create',
    document: {},
    contacts: [],
  };

  constructor(props) {
    super(props);
    const { document, schemas } = props;
    // Search if the document has a schema set
    const selectedSchema = schemas.find(s => {
      return (
        document.attributes &&
        document.attributes._schema &&
        s.name === document.attributes._schema.value
      );
    });

    this.state = {
      submitted: false,
      selectedSchema,
    };

  }

  onSubmit = (values) => {
    const { selectedSchema } = this.state;
    this.props.onSubmit && this.props.onSubmit(
      {
        // add schema as tech field
        '_schema': {
          type: 'string',
          value: selectedSchema.name,
        },
        ...values,
      },
    );
  };


  generateValidationSchema = (attributes: Attribute[]) => {
    let validationSchema = {};
    for (let attr of attributes) {
      switch (attr.type) {
        case 'decimal':
        case 'integer':
          validationSchema[attr.name] = Yup.object().shape({
            value: Yup.number()
              .moreThan(0, 'must be greater than 0')
              .required('This field is required')
              .typeError('must be greater than 0'),
          });
          break;
        case 'timestamp':
          validationSchema[attr.name] = Yup.object().shape({
            value: Yup.date()
              .required('This field is required')
              .typeError('This field is required'),
          });
          break;
        case 'bytes':
          validationSchema[attr.name] = Yup.object().shape({
            value: Yup.string()
              .matches(/^0x/, 'bytes must start with 0x')
              .required('This field is required'),
          });
          break;
        default:
          validationSchema[attr.name] = Yup.object().shape({
            value: Yup.string().required('This field is required'),
          });
          break;
      }
    }

    return Yup.object().shape(validationSchema);
  };


  render() {

    const { submitted, selectedSchema } = this.state;
    const { document, mode, schemas } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const columnGap = 'medium';
    const sectionGap = 'none';
    const validationSchema = selectedSchema ? this.generateValidationSchema(selectedSchema.attributes) : {};

    return (
      <Box pad={{ bottom: 'xlarge' }}>
        <Formik
          validationSchema={validationSchema}
          initialValues={document!.attributes || {}}
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
               handleSubmit,
               setFieldValue,
             }) => (
              <form
                onSubmit={event => {
                  this.setState({ submitted: true });
                  handleSubmit(event);
                }}
              >
                <Box gap={sectionGap}>

                  {this.props.children}

                  <Box gap={columnGap} pad={'medium'}>
                    {(!isEditMode && !isViewMode) && <Box gap={columnGap}>
                      <FormField
                        label="Document Schema"
                      >
                        <SearchSelect
                          labelKey={'name'}
                          options={schemas}
                          value={selectedSchema}
                          onChange={(selected) => {
                            this.setState({ selectedSchema: selected });
                          }}
                        />
                      </FormField>
                    </Box>
                    }
                    {
                      selectedSchema && <Box gap={columnGap}>
                        {
                          this.generateFormField(values, errors, handleChange, setFieldValue, isViewMode)
                        }
                      </Box>
                    }
                  </Box>
                </Box>
              </form>
            )
          }
        </Formik>
      </Box>
    );
  }

  generateFormField = (values, errors, handleChange, setFieldValue, disabled) => {

    const { selectedSchema } = this.state;

    const fields = [selectedSchema.attributes.map(attr => {
      const key = attr.name;
      if (!values[key]) values[key] = { type: attr.type, value: '' };
      return <FormField
        key={key}
        label={attr!.label}
        error={errors[key] && errors[key].value}
      >
        {(() => {
          switch (attr.type) {
            case 'string':
              return <TextInput
                disabled={disabled}
                value={values[key] && values[key].value}
                name={`${key}.value`}
                onChange={handleChange}
              />;
            case 'bytes':
              return <TextInput
                disabled={disabled}
                value={values[key] && values[key].value}
                name={`${key}.value`}
                onChange={handleChange}
              />;
            case 'integer':
              return <NumberInput
                disabled={disabled}
                value={values[key] && values[key].value}
                name={`${key}.value`}
                precision={0}
                onChange={(masked, value) => {
                  setFieldValue(`${key}.value`, value);
                }}
              />;
            case 'decimal':
              return <NumberInput
                disabled={disabled}
                value={values[key] && values[key].value}
                name={`${key}.value`}
                precision={2}
                onChange={(masked, value) => {
                  setFieldValue(`${key}.value`, value);
                }}
              />;

            case 'timestamp':
              return <DateInput
                disabled={disabled}
                value={extractDate(values[key] && values[key].value)}
                name={`${key}.value`}
                onChange={date => {
                  setFieldValue(`${key}.value`, dateToString(date));
                }}
              />;
          }
        })()}
      </FormField>;
    })];

    return fields;
  };
}

export default DocumentForm;


