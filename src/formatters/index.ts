export const dateFormatter = value =>
  value ? new Date(value).toISOString().slice(0, 10) : '';
