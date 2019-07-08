const locale = 'en-US';

export const dateToString = value => {
  try {
    return new Date(value).toISOString();
  } catch (e) {
    return value;
  }
};

// TODO remove this
// This is only a problem with the native component as it only accepts a date
// and we have a string date time. It will be fixed when we use a custom comp
export const extractDate = value => {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (e) {
    return value;
  }
};


export const formatNumber = (value) => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatDate = (value: any) => {
  if (!value) return '';
  if (!(value instanceof Date)) {
    value = new Date(value);
  }
  return new Intl.DateTimeFormat(locale, { month: '2-digit', year: 'numeric', day: '2-digit' }).format(value);
};

export const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};


export const getCurrencyFormat = (currency) => {
  let prefix = formatCurrency(1, currency).replace(/[0-9.,]/g, '');
  // now care only about the prefix
  // TODO we should should also handle the suffix case.
  return {
    ...getNumberFormat(),
    prefix,
  };
};

export const getNumberFormat = () => {
  let thousandSeparator = formatNumber(1111).replace(/1/g, '');
  let decimalSeparator = formatNumber(1.1).replace(/1/g, '');
  return {
    thousandSeparator,
    decimalSeparator,
    precision: 2, // this is the default right now.
  };
};

export const getPercentFormat = () => {

  let suffix = formatPercent(1).replace(/[0-9.,]/g, '');
  return {
    ...getNumberFormat(),
    suffix,
  };
};


export const formatPercent = value => {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2 }).format(value);
};
