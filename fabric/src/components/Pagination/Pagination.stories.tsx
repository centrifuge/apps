import * as React from 'react'
import { Pagination, usePagination } from '.'

export default {
  title: 'Components/Pagination',
}

export function Default() {
  return <Pagination pagination={usePagination({ totalSize: 100, pageSize: 10 })} />
}
