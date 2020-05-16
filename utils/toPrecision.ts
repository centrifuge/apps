import Decimal from 'decimal.js-light';

export const toPrecision = (value: string, precision: number) => new Decimal(value.toString()).toFixed(precision);
