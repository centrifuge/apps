export const dateFormatter = value => {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch(e) {
    return value;
  }
}

