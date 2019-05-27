const invoiceIndex = '/invoices';

export const invoiceRoutes = {
  index: invoiceIndex,
  new: `${invoiceIndex}/new`,
  view: `${invoiceIndex}/:id`,
  edit: `${invoiceIndex}/:id/edit`,
};

const fundingIndex = '/funding-agreements';

export const fundingRoutes = {
  index: fundingIndex,
  new: `${fundingIndex}/new`,
  view: `${fundingIndex}/:id`,
  edit: `${fundingIndex}/:id/edit`,
};
