import * as React from 'react'
import { Pool, UpcomingPool } from '../../config'

interface Props {
  pool: Pool | UpcomingPool
}

interface Post {
  cooked: string
}

function getText(safeHtml: string) {
  const el = document.createElement('div')
  el.innerHTML = safeHtml
  return el.innerText
}

const Posts: React.FC<Props> = ({ pool }) => {
  const [posts, setPosts] = React.useState<Post[]>()

  React.useEffect(() => {
    ;(async () => {
      console.log('request some shit')
      const res = await fetch(
        `/.netlify/functions/getPoolDiscourse?topic=${
          pool.metadata.discourseLink || 'https://discourse.centrifuge.io/t/issuer-harbor-trade-credit/141'
        }`
      ).then((res) => res.json())
      setPosts(res.posts)
    })()
  }, [pool])

  console.log('posts', posts)
  return (
    <div>
      {posts?.slice(0, 3).map((post) => (
        <div>{getText(post.cooked)}</div>
      ))}
    </div>
  )
}

export default Posts
