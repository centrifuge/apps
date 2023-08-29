export async function fetchFromTinlakeSubgraph(query: string, variables?: unknown) {
  const response = await fetch(import.meta.env.REACT_APP_TINLAKE_SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { ...(variables || {}) },
    }),
  })

  if (!response?.ok) {
    throw new Error(`Issue fetching from Tinlake subgraph. Status: ${response?.status}`)
  } else {
    const { data, errors } = await response.json()
    if (errors?.length) {
      throw new Error(`Issue fetching from Subgraph. Errors: ${errors}`)
    }
    return data
  }
}
