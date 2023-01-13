export const fetchLambda = async (url: string, reqInit?: RequestInit) => {
  // const res = await fetch(`https://us-central1-peak-vista-185616.cloudfunctions.net/lambdas/${url}`, reqInit)
  const res = await fetch(`http://localhost:8080/lambdas/${url}`, reqInit)
  if (!res.ok) {
    const resText = await res.text()
    throw new Error(`Error pinning pool metadata: ${resText}`)
  }
  const json = await res.json()
  return json
}
