export const fetchLambda = (url: string, reqInit?: RequestInit) =>
  fetch(`${window.location.origin}/.netlify/functions/${url}`, reqInit)
