declare module '*.abi' {
  const value: any
  export default value
}

declare module NodeJS {
  interface Global {
    XMLHttpRequest: any;
  }
}

interface Window {
  XMLHttpRequest: any;
}
