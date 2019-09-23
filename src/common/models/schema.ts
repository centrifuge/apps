import { isValidAddress } from 'ethereumjs-util';
import { differenceWith, groupBy, isString } from 'lodash';

export interface Attribute {
  name: string,
  label: string,
  section?: string,
  options?: string[],
  type: AttrTypes.STRING | AttrTypes.TIMESTAMP | AttrTypes.INTEGER | AttrTypes.BYTES | AttrTypes.DECIMAL | AttrTypes.PERCENT
}

export interface Registry {
  label: string,
  address: string,
  proofs: Array<string>
}

export enum AttrTypes {
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BYTES = 'bytes',
  STRING = 'string',
  TIMESTAMP = 'timestamp',
  PERCENT = 'percent',
}


export interface FormFeatures {
  columnNo?: number,
  comments?: boolean
  fundingAgreement?:boolean,
  defaultSection?: string
}


const generateAttributeError = (identifier, message) => {
  return new Error(`Error on attributes for '${identifier}': ${message}`);
};


const generateRegistryError = (identifier, message) => {
  return new Error(`Error on registry for '${identifier}': ${message}`);
};

const generateFormFeaturesError = (message) => {
  return new Error(`Error on formFeatures: ${message}`);
};

const generateDiffError = (identifier, message) => {
  return new Error(`Error on diff for '${identifier}': ${message}`);
};

const testForProperty = (obj: object, prop: string) => {
  return !obj[prop] || !obj[prop].toString().trim();
};


export enum DiffErrors {
  NAME_CHANGE_FORBIDEN = 'Changing schema name is not allowed. Create a new one instead',
  ATTRIBUTE_CHANGE_FORBIDEN = 'It is not allowed to delete attributes or change their name and type properties',
}

export enum NameErrors {
  NAME_FORMAT = 'Schema must have name set. This is a unique identifier for the schema.',
}

export enum RegistriesErrors {
  REGISTRIES_FORMAT = 'Registries must an array of Registry objects. It can be empty',
  ADDRESS_PROP_MISSING = 'address property is missing or empty',
  ADDRESS_FORMAT = 'not a valid eth address',
  LABEL_PROP_MISSING = 'label property is missing or empty',
  PROOF_ARRAY_MISSING = 'proofs array is missing or empty'
}

export enum AttributesErrors {
  ATTRIBUTES_FORMAT = 'Schema requires an attributes property containing an array of Attributes. It is mandatory',
  ATTRIBUTES_UNIQUE_NAMES = 'Schema attributes must have unique names',
  NAME_PROP_MISSING = 'name property is missing or empty',
  LABEL_PROP_MISSING = 'label property is missing or empty',
  TYPE_PROP_MISSING = 'type property is missing or empty',
  TYPE_NOT_SUPPORTED = 'type is not valid. Please also check for white spaces!',
  OPTIONS_BAD_FORMAT = 'Options must be an array of values',
  OPTIONS_EMPTY = 'an empty options array does not make sense',
  OPTIONS_NOT_FOR_TIMESTAMP = 'type timestamp does not support options',
  COMMENTS_RESERVED = 'This attribute is reserved for the comments feature. Set \'comments:true\' in the schema or use another name',
  NESTED_ATTRIBUTES_NOT_SUPPORTED = 'Nested attributes are not supported! Do not use . or [ ] in name',
  REFERENCE_ID_MISSING = 'Attributes does not contain a reference_id field'
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
    readonly formFeatures?: FormFeatures,
    readonly archived?: boolean,
    readonly _id?: string,
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
      registries: [],
      formFeatures: {
        fundingAgreement:false,
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
    const { name, attributes, registries, formFeatures } = schema;
    return JSON.stringify({
      name,
      attributes,
      registries,
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
   * Validates a schema name has the proper format
   * @param name string
   */
  public static validateName(name: string) {
    if (testForProperty({ name }, 'name')) {
      throw new Error(NameErrors.NAME_FORMAT);
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

      if (testForProperty(registry, 'address'))
        throw new Error(RegistriesErrors.ADDRESS_PROP_MISSING);

      let valid = isValidAddress(registry.address);
      if (!valid) {
        throw generateRegistryError(registry.address, RegistriesErrors.ADDRESS_FORMAT);
      }

      if (testForProperty(registry, 'label')) {
        throw generateRegistryError(registry.address, RegistriesErrors.LABEL_PROP_MISSING);
      }

      if (!registry.proofs || !Array.isArray(registry.proofs) || !registry.proofs.length) {
        throw generateRegistryError(registry.address, RegistriesErrors.PROOF_ARRAY_MISSING);
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
  public static validateAttributes(attributes: Attribute[]) {
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      const refID = attributes.filter(attr => {

        if (testForProperty(attr, 'name'))
          throw generateAttributeError(JSON.stringify(attr), AttributesErrors.NAME_PROP_MISSING);
        if (testForProperty(attr, 'label'))
          throw generateAttributeError(attr.name, AttributesErrors.LABEL_PROP_MISSING);
        if (testForProperty(attr, 'type'))
          throw generateAttributeError(attr.name, AttributesErrors.TYPE_PROP_MISSING);

        const supportedTypes = Object.values(AttrTypes);
        if (supportedTypes.indexOf(attr.type) < 0)
          throw generateAttributeError(attr.name, AttributesErrors.TYPE_NOT_SUPPORTED);

        if (attr.hasOwnProperty('options')) {
          if (!Array.isArray(attr.options)) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_BAD_FORMAT);
          if (attr.options.length < 1) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_EMPTY);
          if (attr.type === AttrTypes.TIMESTAMP) throw generateAttributeError(attr.name, AttributesErrors.OPTIONS_NOT_FOR_TIMESTAMP);
        }

        if (attr.name === 'comments') {
          throw generateAttributeError(attr.name, AttributesErrors.COMMENTS_RESERVED);
        }

        // eslint-disable-next-line
        const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g;
        const nestedAttrsMatches = attr.name.match(regex);
        if (!nestedAttrsMatches || nestedAttrsMatches.length > 1)
          throw generateAttributeError(attr.name, AttributesErrors.NESTED_ATTRIBUTES_NOT_SUPPORTED);

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
    Schema.validateName(schema.name);
    Schema.validateRegistries(schema.registries);
    Schema.validateAttributes(schema.attributes);
    Schema.validateFormFeatures(schema.formFeatures);
  }
}

