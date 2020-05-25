import BN from 'bn.js';

// regex from https://stackoverflow.com/a/2901298/6694848
export function addThousandsSeparators(x: string|BN) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}
