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
  return new Intl.DateTimeFormat(locale, { month: '2-digit', year: '2-digit', day: '2-digit' }).format(value);
};

export const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'code',
  }).format(value);
};


export const formatPercent = value => {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits:2}).format(value);
};
