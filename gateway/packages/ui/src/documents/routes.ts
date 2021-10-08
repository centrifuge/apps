const documentsIndex = '/documents'

const routes = {
  index: documentsIndex,
  new: `${documentsIndex}/new`,
  view: `${documentsIndex}/:id`,
  edit: `${documentsIndex}/:id/edit`,
}

export default routes
