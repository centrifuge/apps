export const required = value => {
  const errorMessage = 'That field is mandatory';

  if (!value) {
    return errorMessage;
  }

  if (Array.isArray(value) && value.length === 0) {
    return errorMessage;
  }
};
