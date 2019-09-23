import React from 'react';
import { Box, FormField, Grid, ResponsiveContext } from 'grommet';
import { Formik } from 'formik';
import { get } from 'lodash';
import * as Yup from 'yup';
import { Document } from '../common/models/document';
import { AttrTypes, Schema } from '../common/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Contact } from '../common/models/contact';
import { MultipleSelect } from '@centrifuge/axis-multiple-select';
import { Section } from '../components/Section';
import Comments from './Comments';
import Attributes from './Attributes';
import { ViewModeFormContainer } from '../components/ViewModeFormContainer';
import { getContactByAddress } from '../common/contact-utils';


// TODO use function components here
type Props = {
  onSubmit?: (document: Document) => void;
  renderHeader: () => JSX.Element;
  contacts: Contact[];
  schemas?: Schema[],
  mode?: 'edit' | 'view' | 'create',
  document: Document
  selectedSchema?: Schema;
};

type State = {
  submitted: boolean,
  columnGap: string,
  sectionGap: string,
  selectedSchema: Schema
}


export class DocumentForm extends React.Component<Props, State> {

  static defaultProps: Props = {
    onSubmit: () => {
      // do nothing
    },
    renderHeader: () => <></>,
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
    const { selectedSchema } = props;
    this.state = {
      submitted: false,
      columnGap: 'medium',
      sectionGap: 'none',
      selectedSchema,
    };
  }

  onSubmit = (values) => {
    const { selectedSchema } = this.state;

    //

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


  generateValidationSchema = (schema: Schema) => {
    // Attributes validation
    let attributes = {};
    let defaultValues = {};
    if (schema) {
      for (let attr of schema.attributes) {
        const path = `${attr.name}`;
        defaultValues[attr.name] = {
          type: attr.type === AttrTypes.PERCENT ? AttrTypes.STRING : attr.type,
          value: '',
        };
        switch (attr.type) {
          case AttrTypes.DECIMAL:
          case AttrTypes.INTEGER:
          case AttrTypes.PERCENT:
            attributes[path] = Yup.object().shape({
              value: Yup.number()
                .required('This field is required')
                .typeError('must be a number'),
            });
            break;
          case AttrTypes.TIMESTAMP:
            attributes[path] = Yup.object().shape({
              value: Yup.date()
                .required('This field is required')
                .typeError('This field is required'),
            });
            break;
          case AttrTypes.BYTES:
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
      // Add comments field if schema has the option
      if (schema.formFeatures && schema.formFeatures.comments) {
        defaultValues['comments'] = {
          value: '',
          type: AttrTypes.STRING,
        };
      }
    }


    return {
      validationSchema: Yup.object().shape(
        {
          attributes: Yup.object().shape(attributes),
        }),
      defaultValues,
    };
  };


  render() {

    const { submitted, selectedSchema, sectionGap, columnGap } = this.state;
    const { document, mode, children, renderHeader } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const { validationSchema, defaultValues } = this.generateValidationSchema(selectedSchema);


    // Make sure document has the right form in order not to break the form
    // This should never be the case
    if (!document.attributes) {
      document.attributes = defaultValues;
    } else {
      document.attributes = {
        ...defaultValues,
        ...document.attributes,
      };
    }
    if (!document.header) {
      document.header = {};
    }


    if (!document.header.read_access || !Array.isArray(document.header.read_access)) {
      document.header.read_access = [];
    }


    return (
      <ViewModeFormContainer isViewMode={mode === 'view' ? 'view-mode-form' : ''} pad={{ bottom: 'xlarge' }}>
        <ResponsiveContext.Consumer>
          {size => {
            return <Formik
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
                      {renderHeader()}

                      {this.renderDetailsSection(
                        values,
                        errors,
                        handleChange,
                        setFieldValue,
                        isViewMode,
                        isEditMode,
                      )}

                      {children}

                      {selectedSchema && <>
                        <Attributes columnGap={columnGap} schema={selectedSchema} isViewMode={isViewMode} size={size}/>
                        {(selectedSchema.formFeatures && selectedSchema.formFeatures.comments) &&
                        <Comments columnGap={columnGap} isViewMode={isViewMode}/>}
                      </>}

                    </Box>
                  </form>
                )
              }
            </Formik>;
          }}
        </ResponsiveContext.Consumer>

      </ViewModeFormContainer>
    );
  }

  // TODO move this to own component
  renderDetailsSection = (values, errors, handleChange, setFieldValue, isViewMode, isEditMode) => {
    const { selectedSchema, columnGap } = this.state;
    const { contacts, schemas } = this.props;

    return <Section title="Document Details">
      <Grid gap={columnGap}>
        <FormField
          label="Document Schema"
        >
          <SearchSelect
            disabled={isViewMode || isEditMode}
            labelKey={'name'}
            options={schemas}
            value={selectedSchema}
            onChange={(selected) => {
              this.setState({ selectedSchema: selected });
            }}
          />
        </FormField>

        <FormField
          label="Read Access"
        >
          <MultipleSelect
            search={true}
            disabled={isViewMode}
            labelKey={'name'}
            valueKey={'address'}
            options={contacts}
            value={
              get(values, 'header.read_access').map(v => {
                return getContactByAddress(v, contacts);
              })
            }
            onChange={(selection) => {
              setFieldValue('header.read_access', selection.map(i => i.address));
            }}
          />
        </FormField>
      </Grid>
    </Section>;
  };


};

export default DocumentForm;


