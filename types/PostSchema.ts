interface PostSchema {
  _id: string
  createdAt: Date
  modifiedAt?: Date
  slug: string
  content: string
  category?: string
}

export default PostSchema