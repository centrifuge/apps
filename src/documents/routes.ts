const documentsIndex = '/documents';

export const documentRoutes = {
  index: documentsIndex,
  new: `${documentsIndex}/new`,
  view: `${documentsIndex}/:id`,
  edit: `${documentsIndex}/:id/edit`,
};
