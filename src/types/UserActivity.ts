type UserActivity = {
  id?: string

  createdAt?: Date

  data: {
    type: 'VIEW_POST' | 'DOWNLOAD_RAW_POST' | 'NEW_POST'
    postId?: string
  } | string
  country: string | 'N-A'
}

export default UserActivity