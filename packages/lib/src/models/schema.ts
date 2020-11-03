import { isValidAddress } from 'ethereumjs-util';
import { differenceWith, groupBy, isString } from 'lodash';
import { Collaborator } from './collaborator';

export interface Attribute {
  name: string,
  label: string,
  section?: string,
  options?: string[],
  placeholder?: string,
  defaultValue?: string,
  multiplier?: number,
  type: AttrTypes.STRING | AttrTypes.TIMESTAMP | AttrTypes.INTEGER | AttrTypes.BYTES | AttrTypes.DECIMAL | AttrTypes.PERCENT
  subtype?: AttrSubtypes.SIGNED,
  fieldWriteAccess?: string
}

export interface Registry {
  label: string,
  tinlakePool?: string,
  address: string,
  asset_manager_address: string
  proofs: Array<string>
  oracle_address: string
}

export enum AttrTypes {
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BYTES = 'bytes',
  STRING = 'string',
  TIMESTAMP = 'timestamp',
  PERCENT = 'percent',
}

export enum AttrSubtypes {
  SIGNED = 'signed',
}

export interface FormFeatures {
  columnNo?: number,
  comments?: boolean
  fundingAgreement?: boolean,
  defaultSection?: string
}


const generateAttributeError = (identifier, message) => {
  return new Error(`Error on attributes for '${identifier}': ${message}`);
};

const generateRegistryError = (identifier, message) => {
  return new Error(`Error with ${identifier}: ${message}`);
};

const generateFormFeaturesError = (message) => {
  return new Error(`Error on formFeatures: ${message}`);
};

const generateDiffError = (identifier, message) => {
  return new Error(`Error on diff for '${identifier}': ${message}`);
};

const propertyUnset = (obj: object, prop: string) => {
  return !obj[prop] || !obj[prop].toString().trim();
};

export enum DiffErrors {
  NAME_CHANGE_FORBIDEN = 'Changing schema name is not allowed. Create a new one instead',
  ATTRIBUTE_CHANGE_FORBIDEN = 'It is not allowed to delete attributes or change their name and type properties',
}

export enum SchemaPropsErrors {
  NAME_FORMAT = 'Schema must have name set. This is a unique identifier for the schema.',
  LABEL_VALUE_FORMAT = 'label must be a string if set'
}

export enum RegistriesErrors {
  REGISTRIES_FORMAT = 'Registries must an array of Registry objects. It can be empty',
  COLLABORATORS_FORMAT = 'Collaborators must be an array of Collaborator objects. It can be empty',
  ADDRESS_PROP_MISSING = 'Address property is missing or empty',
  ADDRESS_FORMAT = 'Please check that the inserted address is a valid ETH address',
  LABEL_PROP_MISSING = 'Label property is missing or empty',
  PROOF_ARRAY_MISSING = 'Proofs array is missing or empty',
  ASSET_MANAGER_ADDRESS_MISSING = 'Asset manager address is missing or empty'

}

export enum AttributesErrors {
  ATTRIBUTES_FORMAT = 'Schema requires an attributes property containing an array of Attributes. It is mandatory',
  ATTRIBUTES_UNIQUE_NAMES = 'Schema attributes must have unique names',
  NAME_PROP_MISSING = 'name property is missing or empty',
  MULTIPLIER_ONLY_ON_NUMBERS = 'Multiplier attribute can only be set for int and decimal',
  MULTIPLIER_FORMAT = 'Multiplier attribute must be a number',
  LABEL_PROP_MISSING = 'label property is missing or empty',
  TYPE_PROP_MISSING = 'type property is missing or empty',
  TYPE_NOT_SUPPORTED = 'type is not valid. Please also check for white spaces!',
  OPTIONS_BAD_FORMAT = 'Options must be an array of values',
  OPTIONS_EMPTY = 'an empty options array does not make sense',
  OPTIONS_NOT_FOR_TIMESTAMP = 'type timestamp does not support options',
  COMMENTS_RESERVED = 'This attribute is reserved for the comments feature. Set \'comments:true\' in the schema or use another name',
  NESTED_ATTRIBUTES_NOT_SUPPORTED = 'Nested attributes are not supported! Do not use . or [ ] in name',
  REFERENCE_ID_MISSING = 'Attributes does not contain a reference_id field',
  PLACEHOLDER_FORMAT = 'Placeholder property must be a string',
  DEFAULT_VALUE_FORMAT = 'defaultValue property must be a string',
  SUBTYPE_NOT_SUPPORTED = 'subtype is not valid. Please also check for white spaces!',
  FIELD_WRITE_ACCESS_FORMAT = 'fieldWriteAccess property must be a valid eth address',
}


export enum FormFeaturesErrors {
  COLUMN_NO_FORMAT = 'columnNo property must be an integer greater than 0',
  COMMENTS_FORMAT = 'comments property must be an boolean',
  FUNDING_AGREEMENT_FORMAT = 'fundingAgreement property property must be an boolean',
  DEFAULT_SECTION_FORMAT = 'defaultSection property must be a string',
}

export class Schema {

  constructor(
    readonly name: string,
    readonly attributes: Attribute[],
    readonly registries: Registry[],
    readonly collaborators: Collaborator[],
    readonly template: string = '',
    readonly formFeatures?: FormFeatures,
    readonly archived?: boolean,
    readonly _id?: string,
    readonly label?: string,
  ) {
    Schema.validate(this);
  }

  public static getDefaultValues(): Schema {
    return {
      name: '',
      attributes: [
        {
          name: 'reference_id',
          label: 'Reference id',
          type: AttrTypes.STRING,
        },
      ],
      registries: [
        {
          label: 'registry_name',
          tinlakePool: 'https://kovan.staging.tinlake.centrifuge.io/0xbb53072d054de55d56dbb4ee95840de3262e4097',
          address: '0x0000000000000000000000000000000000000000',
          asset_manager_address: '0x0000000000000000000000000000000000000000',
          oracle_address:'0x0000000000000000000000000000000000000000',
          proofs: []
        }
      ],
      template: '',
      collaborators: [],
      formFeatures: {
        fundingAgreement: false,
        columnNo: 2,
        comments: true,
        defaultSection: 'Attributes',

      },
    };
  }


  /**
   * Exposes only properties that should be editable in a Json editor
   * @param schema Schema
   */
  public static toEditableJson(schema: Schema): string {
    const { name, attributes, registries, template, collaborators, formFeatures, label } = schema;
    return JSON.stringify({
      name,
      label,
      attributes,
      registries,
      template,
      collaborators,
      formFeatures,

    }, null, 2);
  }

  /**
   * Validates a schema update
   * When editing a schema previous attributes should not be removed
   * and it is not allowed to change values for the name and type props
   * @param prevSchema Schema
   * @param nextSchema Schema
   */
  public static validateDiff(prevSchema: Schema, nextSchema: Schema) {

    if (prevSchema.name !== nextSchema.name)
      throw new Error(DiffErrors.NAME_CHANGE_FORBIDEN);


    const diffedAttributes = differenceWith(prevSchema.attributes, nextSchema.attributes, (a: Attribute, b: Attribute) => {
      return a.type === b.type && a.name === b.name;
    });

    if (diffedAttributes.length > 0) {
      const identifier = diffedAttributes.map(a => a.name).join(',');
      throw generateDiffError(identifier, DiffErrors.ATTRIBUTE_CHANGE_FORBIDEN);
    }

  }

  /**
   * Validates a schema top level props that do not have their own validation
   * it uses duck typing
   * @param name string
   */
  public static validateSchemaProps(schema: any) {
    if (propertyUnset(schema, 'name')) {
      throw new Error(SchemaPropsErrors.NAME_FORMAT);
    }
    if (!propertyUnset(schema, 'label') && !isString(schema.label)) {
      throw new Error(SchemaPropsErrors.LABEL_VALUE_FORMAT);
    }
  }

  /**
   * Validates registries array for a schema
   * Registries can be undefined
   * @param registries Registry[]
   */
  public static validateRegistries(registries: Registry[] | undefined) {
    // Do not throw errors if the prop is undefined, null, false, empty string
    if (!registries) return;

    if (!Array.isArray(registries)) {
      throw new Error(RegistriesErrors.REGISTRIES_FORMAT);
    }
    registries.forEach(registry => {

      if (propertyUnset(registry, 'label')) {
        throw generateRegistryError('registry label', RegistriesErrors.LABEL_PROP_MISSING);
      }

      if (propertyUnset(registry, 'address')) {
        throw generateRegistryError('registry address', RegistriesErrors.ADDRESS_PROP_MISSING);
      }

      if (propertyUnset(registry, 'asset_manager_address')) {
        throw generateRegistryError('registry asset manager', RegistriesErrors.ASSET_MANAGER_ADDRESS_MISSING);
      }

      let validRegistry = isValidAddress(registry.address);
      if (!validRegistry) {
        throw generateRegistryError(`registry asset manager address ${registry.asset_manager_address}`, RegistriesErrors.ADDRESS_FORMAT);
      }

      let validAssetManager = isValidAddress(registry.asset_manager_address);
      if (!validAssetManager) {
        throw generateRegistryError(`registry address ${registry.address}`, RegistriesErrors.ADDRESS_FORMAT);
      }

      let validOracle = !propertyUnset(registry, 'oracle_address') &&  isValidAddress(registry.oracle_address);
      if (!validOracle) {
        throw generateRegistryError(`oracle address ${registry.oracle_address}`, RegistriesErrors.ADDRESS_FORMAT);
      }

      if (!registry.proofs || !Array.isArray(registry.proofs) || !registry.proofs.length) {
        throw generateRegistryError('registry proofs array', RegistriesErrors.PROOF_ARRAY_MISSING);
      }
    });
  }

  /**
   * Validates attributes array for a schema
   * attributes must set and have at least one attribute
   * The method enforces the presence of a reference_id prop which is used
   * for finding a specific document in a list of documents created based on the schema
   * @param attributes Attribute[]
   */
  public static validateCollaborators(collaborators: Collaborator[]) {
    // Do not throw errors if the prop is undefined, null, false, empty string
    if (!collaborators) return;

    if (!Array.isArray(collaborators)) {
      throw new Error(RegistriesErrors.COLLABORATORS_FORMAT);
    }

    collaborators.forEach(collaborator => {
      Collaborator.validate(collaborator);
    });
  }

  /**
   * Validates attributes array for a schema
   * attributes must set and have at least one attribute
   * The method enforces the presence of a reference_id prop which is used
   * for finding a specific document in a list of documents created based on the schema
   * @param attributes Attribute[]
   */
  public static validateAttributes(attributes: Attribute[]) {
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      const refID = attributes.filter(attr => {

        if (propertyUnset(attr, 'name'))
          throw generateAttributeError(JSON.stringify(attr), AttributesErrors.NAME_PROP_MISSING);
        if (propertyUnset(attr, 'label'))
          throw generateAttributeError(attr.name, AttributesErrors.LABEL_PROP_MISSING);
        if (propertyUnset(attr, 'type'))
          throw generateAttributeError(attr.name, AttributesErrors.TYPE_PROP_MISSING);

        const supportedTypes = Object.values(AttrTypes);
        if (supportedTypes.indexOf(attr.type) < 0)
          throw generateAttributeError(attr.name, AttributesErrors.TYPE_NOT_SUPPORTED);

        if (attr.hasOwnProperty('options')) {
          if (!Array.isArray(attr.options)) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_BAD_FORMAT);
          if (attr.options.length < 1) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_EMPTY);
          if (attr.type === AttrTypes.TIMESTAMP) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_NOT_FOR_TIMESTAMP);
        }

        if(attr.hasOwnProperty('multiplier')) {
          if(typeof attr.multiplier !== 'number')
            throw generateAttributeError(attr.name, AttributesErrors.MULTIPLIER_FORMAT);
          if(([AttrTypes.DECIMAL, AttrTypes.INTEGER].indexOf(attr.type) === - 1))
            throw generateAttributeError(attr.name, AttributesErrors.MULTIPLIER_ONLY_ON_NUMBERS);
        }

        if (attr.name === 'comments') {
          throw generateAttributeError(attr.name, AttributesErrors.COMMENTS_RESERVED);
        }

        // eslint-disable-next-line
        const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g;
        const nestedAttrsMatches = attr.name.match(regex);
        if (!nestedAttrsMatches || nestedAttrsMatches.length > 1)
          throw generateAttributeError(attr.name, AttributesErrors.NESTED_ATTRIBUTES_NOT_SUPPORTED);

        //Make sure defaultValue is a string
        if (attr.hasOwnProperty('defaultValue') && !isString(attr.defaultValue)) {
          throw generateAttributeError(attr.name, AttributesErrors.DEFAULT_VALUE_FORMAT);
        }
        //Make sure placeholder is a string
        if (attr.hasOwnProperty('placeholder') && !isString(attr.placeholder)) {
          throw generateAttributeError(attr.name, AttributesErrors.PLACEHOLDER_FORMAT);
        }

        //Make sure subtype belongs to AttrSubtypes
        const supportedSubtypes = Object.values(AttrSubtypes);
        // @ts-ignore
        if (attr.hasOwnProperty('subtype') && supportedSubtypes.indexOf(attr.subtype) < 0)
          throw generateAttributeError(attr.name, AttributesErrors.SUBTYPE_NOT_SUPPORTED);

        //Make sure fieldWriteAccess is a valid string representing an eth address
        if (attr.hasOwnProperty('fieldWriteAccess') && !(isString(attr.fieldWriteAccess) && isValidAddress(attr.fieldWriteAccess || ''))) {
          throw generateAttributeError(attr.name, AttributesErrors.FIELD_WRITE_ACCESS_FORMAT);
        }

        return attr.name === 'reference_id';
      });
      if (refID.length === 0) {
        throw new Error(AttributesErrors.REFERENCE_ID_MISSING);
      }
    } else {
      throw new Error(AttributesErrors.ATTRIBUTES_FORMAT);
    }

    // Group attributes by name
    const grupupedByName: Attribute[][] = Object.values(groupBy(attributes, (a => a.name)));
    // check if the matrix has more than one column
    for (let group of grupupedByName) {
      if (group.length > 1) {
        throw generateAttributeError(group[0].name, AttributesErrors.ATTRIBUTES_UNIQUE_NAMES);
      }
    }

  }

  /**
   * Validates formFeatures object for a schema
   * form features is not required prop for backward compatibility
   * The lack of formFeatures is handled in the document form rendering
   * @param formFeatures FormFeatures
   */
  public static validateFormFeatures(formFeatures: FormFeatures | undefined) {
    // Do not throw errors if the prop is undefined, null, false, empty string
    if (!formFeatures) return;
    if (formFeatures.hasOwnProperty('columnNo') && (!formFeatures.columnNo || !Number.isInteger(formFeatures.columnNo) || formFeatures.columnNo < 1))
      throw generateFormFeaturesError(FormFeaturesErrors.COLUMN_NO_FORMAT);

    if (formFeatures.hasOwnProperty('comments') && typeof formFeatures.comments !== 'boolean')
      throw generateFormFeaturesError(FormFeaturesErrors.COMMENTS_FORMAT);

    if (formFeatures.hasOwnProperty('formFeatures') && typeof formFeatures.comments !== 'boolean')
      throw generateFormFeaturesError(FormFeaturesErrors.FUNDING_AGREEMENT_FORMAT);

    if (formFeatures.hasOwnProperty('defaultSection') && !isString(formFeatures.defaultSection))
      throw generateFormFeaturesError(FormFeaturesErrors.DEFAULT_SECTION_FORMAT);
  }

  /**
   * Validates an entire schema
   * @param schema Schema
   */
  public static validate(schema: Schema) {
    Schema.validateSchemaProps(schema);
    Schema.validateRegistries(schema.registries);
    Schema.validateCollaborators(schema.collaborators);
    Schema.validateAttributes(schema.attributes);
    Schema.validateFormFeatures(schema.formFeatures);
  }
}

