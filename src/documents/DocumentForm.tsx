import React from 'react';
import { Box, DataTable, FormField, Paragraph, TextInput } from 'grommet';
import { StyledSelect} from 'grommet/components/Select/StyledSelect';
import { StyledTextInput} from 'grommet/components/TextInput/StyledTextInput';
import { Formik } from 'formik';

import * as Yup from 'yup';
import { Document } from '../common/models/document';
import { Attribute, Schema } from '../common/models/schema';
import SearchSelect from '../components/form/SearchSelect';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { dateToString, extractDate } from '../common/formaters';
import { get } from 'lodash';
import { Contact } from '../common/models/contact';
import MutipleSelect from '../components/form/MutipleSelect';
import { Section } from '../components/Section';
import styled from 'styled-components';
import { DisplayField } from '../components/DisplayField';


// improve visibility of inputs in view mode
const StyledFormContainer = styled(Box)`
  ${StyledTextInput}, input[type="text"], ${StyledSelect} button {
       ${props => {
          if (props.mode === 'view')
            return `
              svg {
              opacity: 0;
              }
              cursor:default;
              opacity: 1;`
          }
        }
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
    // Search if the document has a schema set


    this.state = {
      submitted: false,
      columnGap: 'medium',
      sectionGap: 'none',
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

    const { submitted, selectedSchema, sectionGap } = this.state;
    const { document, mode, contacts } = this.props;
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const validationSchema = selectedSchema ? this.generateValidationSchema(selectedSchema.attributes) : {};


    // Make sure document has the right form in order not to break the form
    // This should never be the case
    if (!document.attributes) {
      document.attributes = {};
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

                  {this.renderDetailsSection(
                    values,
                    errors,
                    handleChange,
                    setFieldValue,
                    isViewMode,
                    isEditMode,
                  )}

                  {(isEditMode || isViewMode) && this.renderNftSection()}

                  {selectedSchema && this.renderAttributesSection(
                    values,
                    errors,
                    handleChange,
                    setFieldValue,
                    isViewMode,
                    isEditMode,
                  )}

                </Box>
              </form>
            )
          }
        </Formik>
      </StyledFormContainer>
    );
  }


  renderDetailsSection = (values, errors, handleChange, setFieldValue, isViewMode, isEditMode) => {
    const { selectedSchema, columnGap } = this.state;
    const { contacts, schemas } = this.props;

    return <Section title="Details">
      <Box gap={columnGap}>
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

        {
          selectedSchema && <FormField
            label="Read Access"

          >
            <MutipleSelect
              disabled={isViewMode}
              labelKey={'name'}
              valueKey={'address'}
              options={contacts}
              selected={
                get(values, 'header.read_access').map(v => {
                  return contacts.find(c => c.address!.toLowerCase() === v.toLowerCase());
                })
              }
              onChange={(selection) => {
                setFieldValue('header.read_access', selection.map(i => i.address));
              }}
            />
          </FormField>
        }
      </Box>
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
            render: datum => <DisplayField value={datum.token_id}  noBorder/>
          },

          {
            property: 'registry',
            header: 'Registry',
            render: datum => <DisplayField value={datum.registry}  noBorder/>
          },

          {
            property: 'owner',
            header: 'Owner',
            render: datum => <DisplayField value={datum.owner} noBorder />

          },
        ]}
      />

      {!document!.header!.nfts && <Paragraph color={'dark-2'}>There are no NFTs minted on this document yet.</Paragraph>}

    </Section>);
  };

  renderAttributesSection = (values, errors, handleChange, setFieldValue, isViewMode, isEditMode) => {

    const { selectedSchema, columnGap } = this.state;

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
                disabled={isViewMode}
                value={get(values, key)}
                name={`${key}`}
                onChange={handleChange}
              />;
            case 'bytes':
              return <TextInput
                disabled={isViewMode}
                value={get(values, key)}
                name={`${key}`}
                onChange={handleChange}
              />;
            case 'integer':
              return <NumberInput
                disabled={isViewMode}
                value={get(values, key)}
                name={`${key}`}
                precision={0}
                onChange={(masked, value) => {
                  //TODO there is a problem with onChange for NumberInput
                  // It fires 2 times. First with the event so value is undefined
                  setFieldValue(`${key}`, value && value.toString());
                }}
              />;
            case 'decimal':
              return <NumberInput
                disabled={isViewMode}
                value={get(values, key)}
                name={`${key}`}
                precision={2}
                onChange={(masked, value) => {
                  //TODO there is a problem with onChange for NumberInput
                  // It fires 2 times. First with the event so value is undefined
                  setFieldValue(`${key}`, value && value.toString());
                }}
              />;

            case 'timestamp':
              return <DateInput
                disabled={isViewMode}
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

    return <Section title={'Attributes'}>
      <Box gap={columnGap}>
        {fields}
      </Box>
    </Section>;


  };
}

export default DocumentForm;


