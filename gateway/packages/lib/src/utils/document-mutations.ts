import { Schema } from '../models/schema';
import { Document } from '../models/document';
import { BigNumber } from 'bignumber.js';
/*
 * Applies mutations and transformation that are only valuable when saving data
 * Ex. type conversions, unit transformations, etc
 * */
export const applySchemaRules = (document: Document, schema: Schema) => {
  if (!document.attributes) return;
  schema.attributes.forEach(attr => {
    if (attr.multiplier) {
      const attributes = document.attributes!;
      const multiplier = new BigNumber(attr.multiplier);
      const value = new BigNumber(attributes[attr.name].value!);
      attributes[attr.name].value = value.multipliedBy(multiplier).toFixed();
    }
  });
};

/*
 * Reverts the applySchemaRules in order to add value to the end user
 * Ex: type conversions, unit transformations
 * */
export const revertSchemaRules = (
  document: Document,
  schema: Schema,
) => {
  if (!document.attributes) return;
  schema.attributes.forEach(attr => {
    if (attr.multiplier) {
      const attributes = document.attributes!;
      const multiplier = new BigNumber(attr.multiplier);
      const value = new BigNumber(attributes[attr.name].value!);
      attributes[attr.name].value = value.dividedBy(multiplier).toFixed();
    }
  });
};
