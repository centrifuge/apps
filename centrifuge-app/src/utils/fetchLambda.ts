export const fetchLambda = async (url: string, reqInit?: RequestInit) => {
  const res = await fetch(`${import.meta.env.REACT_APP_LAMBDA_URL}/${url}`, reqInit)
  if (!res.ok) {
    const resText = await res.text()
    throw new Error(`Error pinning pool metadata: ${resText}`)
  }
  const json = await res.json()
  return json
}
