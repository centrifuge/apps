export const formatAddress = (long?: string) => (long ? `${long.slice(0, 6)}...${long.slice(-4)}` : '')
