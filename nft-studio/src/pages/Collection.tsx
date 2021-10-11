import * as React from 'react'
import { useParams } from 'react-router'

export const CollectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <div>Collection, id: {id}</div>
}
