const documentsIndex = '/documents';

export default {
  index: documentsIndex,
  new: `${documentsIndex}/new`,
  view: `${documentsIndex}/:id`,
  edit: `${documentsIndex}/:id/edit`,
};
