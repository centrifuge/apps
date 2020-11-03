import React from 'react';
import { Box, FormField, ResponsiveContext } from 'grommet';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { AttrTypes, Schema } from '@centrifuge/gateway-lib/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { Section } from '../components/Section';
import Comments from './Comments';
import Attributes from './Attributes';
import { ViewModeFormContainer } from '../components/ViewModeFormContainer';
import Collaborators from './Collaborators';
import {
  applySchemaRules,
  revertSchemaRules,
} from '@centrifuge/gateway-lib/utils/document-mutations';

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

    found && revertSchemaRules(document, found);

    this.state = {
      submitted: false,
      columnGap: 'medium',
      sectionGap: 'none',
      selectedSchema: found,
    };
  }
  selectSchema = selected => {
    this.setState({ selectedSchema: selected });
  };

  onSubmit = values => {
    const { selectedSchema } = this.state;
    const { onSubmit, document } = this.props;
    const template = selectedSchema && selectedSchema.template;

    let payload = {
      ...values,
      header: {
        // @ts-ignore
        read_access: document.header.read_access,
        // @ts-ignore
        write_access: document.header.write_access,
      },
      attributes: {
        ...values.attributes,
        // add schema as tech field
        _schema: {
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
    const { document } = this.props;
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

  generateValidationSchema = (schema: Schema | undefined) => {
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
      validationSchema: Yup.object().shape({
        attributes: Yup.object().shape(attributes),
      }),
      defaultValues,
    };
  };

  render() {
    const { submitted, selectedSchema, sectionGap, columnGap } = this.state;
    const {
      document,
      mode,
      children,
      renderHeader,
      contacts,
      schemas,
    } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const { validationSchema, defaultValues } = this.generateValidationSchema(
      selectedSchema,
    );

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
      document.header = {
        // @ts-ignore
        read_access: [],
        write_access: [],
      };
    }

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
                validationSchema={validationSchema}
                initialValues={document}
                validateOnBlur={submitted}
                validateOnChange={submitted}
                onSubmit={(values, { setSubmitting }) => {
                  this.onSubmit(values);
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

                      <Section title="Document Details">
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
                      </Section>
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
