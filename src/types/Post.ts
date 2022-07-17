type Post = {
  id?: string

  createdAt: Date
  updatedAt?: Date

  title: string
  slug: string
  content: string

  category: string
  published: boolean
}

export default Post