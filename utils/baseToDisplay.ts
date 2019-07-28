import BN from 'bn.js';

export const baseToDisplay = (base: string|BN, decimals: number): string => {
  const baseStr = typeof base === 'string' ? base : base.toString();
  const a = baseStr.slice(0, -decimals) || '0';
  const b = baseStr.slice(-decimals).padStart(decimals, '0');
  return `${a}.${b}`;
};
