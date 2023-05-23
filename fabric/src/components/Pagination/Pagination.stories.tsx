import * as React from 'react'
import { Pagination, usePagination } from '.'

export default {
  title: 'Components/Pagination',
}

export const Default: React.FC = () => {
  return <Pagination pagination={usePagination({ totalSize: 100, pageSize: 10 })} />
}
