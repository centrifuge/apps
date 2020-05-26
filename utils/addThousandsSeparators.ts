import BN from 'bn.js';

// regex from https://stackoverflow.com/a/2901298/6694848
export function addThousandsSeparators(x: string|BN) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
