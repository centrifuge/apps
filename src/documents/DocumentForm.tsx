import React from 'react';
import { Box, DataTable, FormField, Grid, Paragraph, ResponsiveContext, TextArea } from 'grommet';
import { StyledSelect } from 'grommet/components/Select/StyledSelect';
import { StyledTextInput } from 'grommet/components/TextInput/StyledTextInput';
import { StyledTextArea } from 'grommet/components/TextArea/StyledTextArea';
import { Formik } from 'formik';
import { get } from 'lodash';
import * as Yup from 'yup';
import { Document } from '../common/models/document';
import { AttrTypes, Schema } from '../common/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Contact } from '../common/models/contact';
import { MultipleSelect } from '@centrifuge/axis-multiple-select';
import { Section } from '../components/Section';
import styled from 'styled-components';
import { DisplayField } from '@centrifuge/axis-display-field';
import AttributeField from './AttributeField';

// improve visibility of inputs in view mode
const StyledFormContainer = styled(Box)`
  ${StyledTextInput}, ${StyledTextArea}, input[type="text"], textarea, ${StyledSelect} button {
       ${props => {
  if (props.mode === 'view')
    return ` svg {
                    opacity: 0;
                    }
                    cursor:default;
                    opacity: 1;`;
}}
  }  
 `;

type Props = {
  onSubmit?: (document: Document) => void;
  contacts: Contact[];
  schemas: Schema[],
  mode?: 'edit' | 'view' | 'create',
  editMode?: boolean,
  document: Document
  selectedSchema?: Schema;
  mintActions?: JSX.Element[];
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

    const { submitted, selectedSchema, sectionGap } = this.state;
    const { document, mode, contacts } = this.props;
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

    // Handle cent ids that are not in contacts
    document.header.read_access.forEach(centId => {
      if (!contacts.find(c => c.address!.toLowerCase() === centId.toLowerCase())) {
        contacts.push({
          name: centId,
          address: centId,
        });
      }
    });


    return (
      <StyledFormContainer mode={mode} pad={{ bottom: 'xlarge' }}>
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
                      {this.props.children}

                      {this.renderDetailsSection(
                        values,
                        errors,
                        handleChange,
                        setFieldValue,
                        isViewMode,
                        isEditMode,
                      )}

                      {(isEditMode || isViewMode) && this.renderNftSection()}

                      {selectedSchema && <>
                        {this.renderAttributesSections(
                          values,
                          errors,
                          handleChange,
                          setFieldValue,
                          isViewMode,
                          isEditMode,
                          size,
                        )}
                        {(selectedSchema.formFeatures && selectedSchema.formFeatures.comments) && this.renderCommentsSection(
                          values,
                          errors,
                          handleChange,
                          setFieldValue,
                          isViewMode,
                        )}
                      </>}

                    </Box>
                  </form>
                )
              }
            </Formik>;
          }}
        </ResponsiveContext.Consumer>

      </StyledFormContainer>
    );
  }


  getSectionGridProps = (size) => {
    const { selectedSchema: { formFeatures } } = this.state;

    let numOfRows = (formFeatures && formFeatures.columnNo) ? formFeatures.columnNo : 1;
    switch (size) {
      case 'medium':
        numOfRows = Math.min(4, numOfRows);
        break;
      case 'small':
        numOfRows = 1;

    }
    return {
      gap: this.state.columnGap,
      style: { gridTemplateColumns: `repeat(${numOfRows}, 1fr)` },
    };
  };


  renderDetailsSection = (values, errors, handleChange, setFieldValue, isViewMode, isEditMode) => {
    const { selectedSchema, columnGap } = this.state;
    const { contacts, schemas } = this.props;

    return <Section title="Details">
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
                return contacts.find(c => c.address!.toLowerCase() === v.toLowerCase());
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

  renderCommentsSection = (values, errors, handleChange, setFieldValue, isViewMode) => {
    const { columnGap } = this.state;
    const key = `attributes.comments.value`;
    return <Section title="Comments">
      <Grid gap={columnGap}>
        <FormField
          key={key}
          error={get(errors, key)}
        >
          <TextArea
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            onChange={handleChange}
          />
        </FormField>
      </Grid>
    </Section>;
  };


  renderNftSection = () => {

    const { mintActions, document } = this.props;

    return (<Section
      title="NFTs"
      actions={mintActions}
    >

      <DataTable
        size={'100%'}
        sortable={false}
        data={document!.header!.nfts || []}
        primaryKey={'token_id'}
        columns={[
          {
            property: 'token_id',
            header: 'Token id',
            render: datum => <DisplayField value={datum.token_id} noBorder/>,
          },

          {
            property: 'registry',
            header: 'Registry',
            render: datum => <DisplayField value={datum.registry} noBorder/>,
          },

          {
            property: 'owner',
            header: 'Owner',
            render: datum => <DisplayField value={datum.owner} noBorder/>,

          },
        ]}
      />

      {!document!.header!.nfts &&
      <Paragraph color={'dark-2'}>There are no NFTs minted on this document yet.</Paragraph>}
    </Section>);
  };

  renderAttributesSections = (values, errors, handleChange, setFieldValue, isViewMode, isEditMode, size) => {

    const { selectedSchema: { formFeatures, attributes } } = this.state;
    const defaultSectionName = formFeatures && formFeatures.defaultSection ? formFeatures.defaultSection : 'Attributes';
    const sections = {};
    // Group in sections
    attributes.forEach((attr) => {
      const sectionName = attr.section || defaultSectionName;
      if (!sections[sectionName]) sections[sectionName] = [];
      sections[sectionName].push(
        <AttributeField key={attr.name} attr={attr} isViewMode={isViewMode}/>,
      );
    });

    return Object.keys(sections).map(name => {
      return <Section title={name}>
        <Grid {...this.getSectionGridProps(size)}>
          {sections[name]}
        </Grid>
      </Section>;
    });

  };

};

export default DocumentForm;


