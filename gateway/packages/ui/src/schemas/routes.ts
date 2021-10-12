const schemaIndex = '/schemas'

const routes = {
  view: `${schemaIndex}/:id`,
  edit: `${schemaIndex}/:id/edit`,
  index: schemaIndex,
}

export default routes
