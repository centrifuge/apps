export function shortAddr(addr: string): string {
  return `${addr.substr(0, 4)}...${addr.substr(-4)}`
}
