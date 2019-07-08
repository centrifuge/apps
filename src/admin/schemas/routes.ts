const schemaIndex = '/schemas';

export const schemasRoutes = {
  view: `${schemaIndex}/:id`,
  edit: `${schemaIndex}/:id/edit`,
  index: schemaIndex,
};