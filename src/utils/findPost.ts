import { PrismaClient } from '@prisma/client'
import Post from '../types/Post'

const findPosts = async (prisma: PrismaClient, criteria: { id?: string, slug?: string, title?: string, content?: string }, strict = true) => {
  let posts: Post[] = []

  if(criteria.id) {
    const found = await prisma.post.findUnique({
      where: {
        id: criteria.id,
      },
    })

    if(found) {
      posts.push(found)
    }
  } else if(criteria.slug) {
    const found = await prisma.post.findFirst({
      where: {
        slug: criteria.slug,
      },
    })

    if(found) {
      posts.push(found)
    }
  } else if(criteria.title) {
    const found = await prisma.post.findMany({
      where: {
        title: {
          contains: criteria.title,
        },
      },
    })

    if(found) {
      posts = posts.concat(found)
    }
  } else if(criteria.content) {
    const found = await prisma.post.findMany({
      where: {
        content: {
          contains: criteria.content,
        },
      },
    })

    if(found) {
      posts = posts.concat(found)
    }
  }

  return posts
}

export default findPosts