import React from 'react';
import { Box, FormField, ResponsiveContext } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { AttrTypes, Schema } from '@centrifuge/gateway-lib/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import Comments from './Comments';
import Attributes from './Attributes';
import { ViewModeFormContainer } from '../components/ViewModeFormContainer';
import Collaborators from './Collaborators';
import {
  applySchemaRules,
  revertSchemaRules,
} from '@centrifuge/gateway-lib/utils/document-mutations';
import { HARDCODED_FIELDS } from '@centrifuge/gateway-lib/utils/constants';
import AttributeSection from './AttributeSection';
import { cloneDeep } from 'lodash';

// TODO use function components here
type Props = {
  onSubmit?: (document: Document) => void;
  renderHeader?: () => JSX.Element;
  contacts: Contact[];
  schemas?: Schema[];
  mode?: 'edit' | 'view' | 'create';
  document: Document;
  selectedSchema?: Schema;
};

type State = {
  submitted: boolean;
  columnGap: string;
  sectionGap: string;
  document: Document;
  validationSchema: any;
  selectedSchema?: Schema;
};

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
        // @ts-ignore
        read_access: [],
        write_access: [],
      },
      template: '',
    },
    contacts: [],
  };

  constructor(props) {
    super(props);
    const { schemas, document, selectedSchema } = props;
    // If no selectedSchema is provided search if the provided document has a
    // _schema defined and select it
    // The selectedSchema prop is used when the selectedSchema is calculated in the parent component
    // in order not to do the same calculation twice. Ex: in EditDocument.tsx we need schema to pass
    // down the registries to the Nfts section
    const found: Schema | undefined =
      selectedSchema ||
      schemas.find(s => {
        return (
          document &&
          document.attributes &&
          document.attributes._schema &&
          s.name === document.attributes._schema.value
        );
      });
    const { validationSchema, clone } = this.generateDefaultValuesAndValidation(
      found,
      document,
    );

    found && revertSchemaRules(clone, found);

    this.state = {
      submitted: false,
      columnGap: 'medium',
      sectionGap: 'none',
      document: clone,
      validationSchema,
      selectedSchema: found,
    };
  }
  selectSchema = selected => {
    const { validationSchema, clone } = this.generateDefaultValuesAndValidation(
      selected,
      this.props.document,
    );
    revertSchemaRules(clone, selected);
    this.setState({
      selectedSchema: selected,
      document: clone,
      validationSchema,
    });
  };

  onSubmit = values => {
    const { selectedSchema, document } = this.state;
    const { onSubmit } = this.props;
    const template = selectedSchema && selectedSchema.template;

    let payload = {
      ...values,
      header: {
        // @ts-ignore
        ...document.header,
      },
      attributes: {
        ...values.attributes,
        // add schema as tech field
        [HARDCODED_FIELDS.SCHEMA]: {
          type: 'string',
          value: selectedSchema!.name,
        },
      },
      template: template,
    };
    applySchemaRules(payload, selectedSchema!);
    onSubmit && onSubmit(payload);
  };

  addCollaboratorToPayload = (collaborators: Array<any>) => {
    const { document } = this.state;
    let read_access = [];
    let write_access = [];

    collaborators.forEach(c => {
      // @ts-ignore
      if (c.access === 'read_access' && !read_access.includes(c.address)) {
        // @ts-ignore
        read_access.push(c.address);
      }
      // @ts-ignore
      if (c.access === 'write_access' && !write_access.includes(c.address)) {
        // @ts-ignore
        write_access.push(c.address);
      }
    });
    // @ts-ignore
    document.header.read_access = read_access;
    // @ts-ignore
    document.header.write_access = write_access;
  };

  generateDefaultValuesAndValidation = (
    schema: Schema | undefined,
    document: Document,
  ) => {
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
        defaultValues[HARDCODED_FIELDS.COMMENTS] = {
          value: '',
          type: AttrTypes.STRING,
        };
      }
    }
    const clone = cloneDeep(document);
    if (!clone.attributes) {
      clone.attributes = defaultValues;
    } else {
      clone.attributes = {
        ...defaultValues,
        ...clone.attributes,
      };
    }

    if (!clone.header) {
      clone.header = {
        // @ts-ignore
        read_access: [],
        write_access: [],
      };
    }

    return {
      validationSchema: Yup.object().shape({
        attributes: Yup.object().shape(attributes),
      }),
      clone,
    };
  };

  render() {
    const {
      submitted,
      selectedSchema,
      sectionGap,
      columnGap,
      document,
      validationSchema,
    } = this.state;
    const { mode, children, renderHeader, contacts, schemas } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    // Make sure document has the right form in order not to break the form
    // This should never be the case

    const documentProps: any[] = [];
    document.attributes![HARDCODED_FIELDS.ORIGINATOR] &&
      documentProps.push({
        ...document.attributes![HARDCODED_FIELDS.ORIGINATOR],
        label: 'Originator',
        name: HARDCODED_FIELDS.ORIGINATOR,
      });
    document.attributes![HARDCODED_FIELDS.ASSET_IDENTIFIER] &&
      documentProps.push({
        ...document.attributes![HARDCODED_FIELDS.ORIGINATOR],
        label: 'Asset ID',
        name: HARDCODED_FIELDS.ASSET_IDENTIFIER,
      });

    // If a set of collaborators is set on schema, use it as default
    const collaborators =
      (selectedSchema && selectedSchema.collaborators) || [];

    return (
      <ViewModeFormContainer
        isViewMode={mode === 'view'}
        pad={{ bottom: 'xlarge' }}
      >
        <ResponsiveContext.Consumer>
          {size => {
            return (
              <Formik
                enableReinitialize={true}
                validationSchema={validationSchema}
                initialValues={document}
                validateOnBlur={submitted}
                validateOnChange={submitted}
                onSubmit={(values, { setSubmitting }) => {
                  this.onSubmit(cloneDeep(values));
                  setSubmitting(true);
                }}
              >
                {({ handleSubmit }) => (
                  <form
                    onSubmit={event => {
                      this.setState({ submitted: true });
                      handleSubmit(event);
                    }}
                  >
                    <Box gap={sectionGap}>
                      {renderHeader && renderHeader()}

                      <AttributeSection
                        columnGap={columnGap}
                        attributes={documentProps}
                        columnNo={2}
                        size={size}
                        name={'Document Details'}
                        isViewMode={true}
                      >
                        <FormField label="Document Schema">
                          <SearchSelect
                            disabled={isViewMode || isEditMode}
                            labelKey={item => {
                              return item.label || item.name;
                            }}
                            options={schemas}
                            value={selectedSchema || ''}
                            onChange={this.selectSchema}
                          ></SearchSelect>
                        </FormField>
                      </AttributeSection>
                      <Collaborators
                        contacts={contacts}
                        collaborators={collaborators}
                        viewMode={isViewMode}
                        addCollaboratorToPayload={this.addCollaboratorToPayload}
                      />
                      {children}
                      {selectedSchema && (
                        <>
                          <Attributes
                            columnGap={columnGap}
                            schema={selectedSchema}
                            isViewMode={isViewMode}
                            size={size}
                          />
                          {selectedSchema.formFeatures &&
                            selectedSchema.formFeatures.comments && (
                              <Comments
                                columnGap={columnGap}
                                isViewMode={isViewMode}
                              />
                            )}
                        </>
                      )}
                    </Box>
                  </form>
                )}
              </Formik>
            );
          }}
        </ResponsiveContext.Consumer>
      </ViewModeFormContainer>
    );
  }
}

export default DocumentForm;
