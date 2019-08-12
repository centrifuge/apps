import { isValidAddress } from 'ethereumjs-util';

export interface Attribute {
  name: string,
  label: string,
  type: AttrTypes.STRING | AttrTypes.TIMESTAMP | AttrTypes.INTEGER | AttrTypes.BYTES | AttrTypes.DECIMAL
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
}


export class Schema {
  constructor(
    readonly name: string,
    readonly attributes: Attribute[],
    public registries: Registry[],
    readonly _id?: string,
  ) {
    Schema.validate(this);
  }


  public static validate(schema: Schema) {
    // Validate registries
    schema.registries.forEach(registry => {
      let valid = isValidAddress(registry.address);
      if (!valid) {
        throw new Error(`${registry.address} is not a valid registry address`);
      }

      if(!registry.label || !registry.label.toString().trim()) {
        throw new Error(`Definition for ${registry.address} must include a label`);
      }

      if(!registry.proofs || !Array.isArray(registry.proofs) || !registry.proofs.length) {
        throw new Error(`Definition for ${registry.address} must include a proofs array`);
      }

    });

    // Validate name
    if(!schema.name || !schema.name.toString().trim()) {
      throw new Error(`Schema does not contain a name attribute`);
    }

    // Validate attributes
    if (schema.attributes && Array.isArray(schema.attributes) && schema.attributes.length > 0) {
      const refID = schema.attributes.filter(attr => {
        if (!attr.name || !attr.name.toString().trim())
          throw new Error(`All attributes must have a name defined`);
        if (!attr.label || !attr.label.toString().trim())
          throw new Error(`All attributes must have a label defined`);
        if (!attr.type || !attr.type.toString().trim())
          throw new Error(`All attributes must have a type defined`);

        const supportedTypes = Object.values(AttrTypes);
        if(supportedTypes.indexOf(attr.type) <0)
          throw new Error(`Type ${attr.type} is not valid. 
          The supported types are ${supportedTypes.join(', ')}. 
          Please also check for white spaces!`);
        // eslint-disable-next-line
        const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g;
        const nestedAttrsMatches = attr.name.match(regex);
        if (!nestedAttrsMatches || nestedAttrsMatches.length > 1)
          throw new Error(`Nested attributes are not supported! Rename ${attr.name} and to not use . or [ ]`);

        return attr.name === 'reference_id';
      });
      if (refID.length === 0) {
        throw new Error(`Attributes do not contain a reference ID`);
      }
    } else {
      throw new Error(`Schema does not contain a attributes array`);
    }

  }
}

