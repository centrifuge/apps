import { Schema } from '../models/schema';

export const mapSchemaNames = (nameList: string[], schemas: Schema[]): Schema[] => {
  const map = nameList.map(name => {
    return schemas.find(schema => schema.name === name);
  }).filter(i => i);
  return map as Schema[];
};

export const getSchemaByName = (name: string, schemas: Schema[]): Schema | undefined => {
  return schemas.find(schema => schema.name === name);
};

// It will find a schema by name and try to return the label if has one
// If schema does not exit it will return an empty string and if the schema
// does not have a label it will return the name
export const getSchemaLabel = (name: string, schemas: Schema[]): string => {
  const schema = schemas.find(schema => schema.name === name);
  return schema ? (schema.label || schema.name) : '';
};
