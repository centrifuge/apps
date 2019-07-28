export const displayToBase = (display: string, decimals: number): string => {
  const a = display.split('.')[0];
  const b = (display.split('.')[1] || '').padEnd(decimals, '0').substr(0, decimals);
  return `${a}${b}`;
};
