import { Schema } from './models/schema';

export const mapSchemaNames = (nameList: string[], schemas: Schema[]) : Schema[]  => {
  const map = nameList.map(name => {
    return schemas!.find(schema => schema.name === name);
  }).filter( i => i);
  return map as Schema[];
}
