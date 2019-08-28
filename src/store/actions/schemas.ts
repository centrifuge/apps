import { getActions } from './action-type-generator';
import { Schema } from "../../common/models/schema";

const CREATE_SCHEMA_BASE_TYPE = 'CREATE_SCHEMA_ACTION';
const GET_SCHEMAS_LIST_BASE_TYPE = 'GET_SCHEMAS_LIST_ACTION';
const GET_SCHEMA_BASE_TYPE = 'GET_SCHEMA_ACTION';
const UPDATE_SCHEMA_BASE_TYPE = 'UPDATE_SCHEMA_ACTION';
const ARCHIVE_SCHEMA_BASE_TYPE = 'ARCHIVE_SCHEMA_ACTION';

export const createSchemaAction = getActions(CREATE_SCHEMA_BASE_TYPE);
export const getSchemasListAction = getActions(GET_SCHEMAS_LIST_BASE_TYPE);
export const getSchemaAction = getActions(GET_SCHEMA_BASE_TYPE);
export const updateSchemaAction = getActions(UPDATE_SCHEMA_BASE_TYPE);
export const archiveSchemaAction = getActions(ARCHIVE_SCHEMA_BASE_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createSchema = (schema: Schema) =>
    action(createSchemaAction.start, { schema});
export const resetCreateSchema = () => action(createSchemaAction.reset);
export const getSchema = id => action(getSchemaAction.start, { id });
export const resetGetSchema = () => action(getSchemaAction.reset);
export const getSchemasList = (query = {}) => action(getSchemasListAction.start,{query});
export const resetGetSchemasList = () => action(getSchemasListAction.reset);
export const updateSchema = (schema: Schema) => action(updateSchemaAction.start, { schema });
export const archiveSchema = (id: string) => action(archiveSchemaAction.start, { id });
export const resetUpdateSchema = () => action(updateSchemaAction.reset);
