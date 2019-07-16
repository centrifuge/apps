import React from 'react';
import { Box, FormField, TextInput } from 'grommet';
import { Formik } from 'formik';

import * as Yup from 'yup';
import { CoreapiDocumentResponse } from '../../clients/centrifuge-node';
import { Attribute, Schema } from '../common/models/schema';
import SearchSelect from '../components/form/SearchSelect';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { dateToString, extractDate } from '../common/formaters';
import { get } from 'lodash';
import { Contact } from '../common/models/contact';
import MutipleSelect from '../components/form/MutipleSelect';

type Props = {
  onSubmit?: (document: CoreapiDocumentResponse) => void;
  contacts: Contact[];
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
    document: {
      attributes: {},
      header: {
        read_access: [],
      },
    },
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
    const payload = {
      ...values,
      attributes: {
        ...values.attributes,
        // add schema as tech field
        '_schema': {
            type: 'string',
            value: selectedSchema.name,
          },
      },
    };

    this.props.onSubmit && this.props.onSubmit(payload);
  };


  generateValidationSchema = (fields: Attribute[]) => {
    // Attributes validation
    let attributes = {};
    for (let attr of fields) {
      const path = `${attr.name}`;
      switch (attr.type) {
        case 'decimal':
        case 'integer':
          attributes[path] = Yup.object().shape({
            value: Yup.number()
              .moreThan(0, 'must be greater than 0')
              .required('This field is required')
              .typeError('must be greater than 0'),
          });
          break;
        case 'timestamp':
          attributes[path] = Yup.object().shape({
            value: Yup.date()
              .required('This field is required')
              .typeError('This field is required'),
          });
          break;
        case 'bytes':
          attributes[path] = Yup.object().shape({
            value: Yup.string()
              .matches(/^0x/, 'bytes must start with 0x')
              .required('This field is required'),
          });
          break;
        default:
          attributes[path] = Yup.object().shape({
            value: Yup.string().required('This field is required'),
          });
          break;
      }
    }

    return Yup.object().shape(
      {
        attributes: Yup.object().shape(attributes),
      });
  };


  render() {

    const { submitted, selectedSchema } = this.state;
    const { document, mode, schemas, contacts } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const columnGap = 'medium';
    const sectionGap = 'none';
    const validationSchema = selectedSchema ? this.generateValidationSchema(selectedSchema.attributes) : {};


    // Make sure document has the right form in order not to break the form
    // This should never be the case
    if(!document.attributes) {
      document.attributes = {};
    }
    if(!document.header) {
      document.header = {};
    }
    if(!document.header.read_access || !Array.isArray(document.header.read_access)) {
      document.header.read_access = [];
    }

    // Handle cent ids that are not in contacts
    document.header.read_access.forEach(centId => {
      if(!contacts.find(c => c.address === centId)) {
        contacts.push({
          name:centId,
          address:centId,
        })
      }
    })


    return (
      <Box pad={{ bottom: 'xlarge' }}>
        <Formik
          validationSchema={validationSchema}
          initialValues={document}
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
                        <FormField
                          label="Read Access"
                        >
                          <MutipleSelect
                            disabled={isViewMode}
                            labelKey={'name'}
                            valueKey={'address'}
                            options={contacts}
                            selected={
                              get(values, 'header.read_access').map(v => {
                                return contacts.find(c => c.address === v);
                              })
                            }
                            onChange={(selection) => {
                              setFieldValue('header.read_access', selection.map(i => i.address));
                            }}
                          />
                        </FormField>
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
      const key = `attributes.${attr.name}.value`;

      if (!values.attributes[attr.name]) values.attributes[attr.name] = { type: attr.type, value: '' };
      return <FormField
        key={key}
        label={attr!.label}
        error={get(errors, key)}
      >
        {(() => {
          switch (attr.type) {
            case 'string':
              return <TextInput
                disabled={disabled}
                value={get(values, key)}
                name={`${key}`}
                onChange={handleChange}
              />;
            case 'bytes':
              return <TextInput
                disabled={disabled}
                value={get(values, key)}
                name={`${key}`}
                onChange={handleChange}
              />;
            case 'integer':
              return <NumberInput
                disabled={disabled}
                value={get(values, key)}
                name={`${key}`}
                precision={0}
                onChange={(masked, value) => {
                  setFieldValue(`${key}`, value);
                }}
              />;
            case 'decimal':
              return <NumberInput
                disabled={disabled}
                value={get(values, key)}
                name={`${key}`}
                precision={2}
                onChange={(masked, value) => {
                  setFieldValue(`${key}`, value);
                }}
              />;

            case 'timestamp':
              return <DateInput
                disabled={disabled}
                value={extractDate(get(values, key))}
                name={`${key}`}
                onChange={date => {
                  setFieldValue(`${key}`, dateToString(date));
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


