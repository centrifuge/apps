const locale = 'en-US';

export const dateToString = value => {
  try {
    return new Date(value).toISOString();
  } catch (e) {
    return value;
  }
};

export const extractDate = value => {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (e) {
    return value;
  }
};

export const formatNumber = value => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatDate = (value: any, withTime: boolean = false) => {
  if (!value) return '';
  if (!(value instanceof Date)) {
    value = new Date(value);
  }
  let options: any = {
    month: '2-digit',
    year: 'numeric',
    day: '2-digit',
  };
  if (withTime) {
    options = {
      ...options,
      hour: 'numeric',
      minute: 'numeric',
    };
  }
  return new Intl.DateTimeFormat(locale, options).format(value);
};

export const formatCurrency = (value, currency) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  } catch (e) {
    return `${currency} `;
  }
};

export const getCurrencyFormat = currency => {
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
    fixedDecimalScale: true,
    decimalScale: 2,
  };
};

export const formatPercent = value => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value);
};
