export const fetchLambda = (url: string, reqInit?: RequestInit) =>
  fetch(`${window.location.origin}/.netlify/functions/${url}`, reqInit)

export const fetchLambdaNew = async (url: string, reqInit?: RequestInit) => {
  const res = await fetch(`${window.location.origin}/.netlify/functions/${url}`, reqInit)
  if (!res.ok) {
    const resText = await res.text()
    throw new Error(`Error pinning pool metadata: ${resText}`)
  }
  const json = await res.json()
  return json
}
