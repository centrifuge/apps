declare let web3: any;

function hexToBytes(hex: string) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes: any[]) {
  const hex = [];
  for (let i = 0; i < bytes.length; i++) {
    const current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xF).toString(16));
  }
  return hex.join('');
}

export function convert(s: string) {
  const bytes = hexToBytes(s);
  const str = `0x${bytesToHex(bytes)}`;
  return Math.trunc(web3.toBigNumber(str).toNumber() * 1000);
}
