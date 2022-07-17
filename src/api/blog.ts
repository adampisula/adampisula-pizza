import { Router } from 'express'
import logUserActivity from '../utils/logUserActivity'
import ExtendedRequest from '../types/ExtendedRequest'
import findPosts from '../utils/findPost'

const router = Router()

router.post('/posts', async (req: ExtendedRequest, res) => {
  if(req.body.key == req.key) {
    if(!(req.body.title && req.body.slug && req.body.content)) {
      return res.status(400)
        .json({
          message: 'Title, slug and content are required'
        })
    } else {
      const post = await req.prisma.post.create({
        data: {
          title: req.body.title,
          slug: req.body.slug,
          content: req.body.content,
          category: req.body.category,
          published: req.body.published,
        },
      })

      return res.status(201)
        .json({
          message: 'Post created',
          post
        })
    }
  } else {
    return res.status(401)
      .json({
        message: 'Unauthorized access',
      })
  }
})

router.get('/posts/by-id/:id/:file?', async (req: ExtendedRequest, res) => {
  const found = await findPosts(req.prisma, {
    id: req.params.id,
  })

  if(found.length > 0) {
    const post = found[0]

    if(req.params.file == 'raw') {
      logUserActivity(req.prisma, { country: req.country, data: { type: 'DOWNLOAD_RAW_POST', postId: post.id } })

      return res.status(200)
        .attachment(`${post.slug}.md`)
        .send(post.content)
    } else {
      logUserActivity(req.prisma, { country: req.country, data: { type: 'VIEW_POST', postId: post.id } })

      return res.status(200)
        .json(post)
    }
  } else {
    return res.status(404).json({
      message: 'Post not found',
    })
  }
})

router.get('/posts/by-slug/:slug/:file?', async (req: ExtendedRequest, res) => {
  const found = await findPosts(req.prisma, {
    slug: req.params.slug,
  })

  if(found.length > 0) {
    const post = found[0]

    if(req.params.file == 'raw') {
      logUserActivity(req.prisma, { country: req.country, data: { type: 'DOWNLOAD_RAW_POST', postId: post.id } })

      return res.status(200)
        .attachment(`${post.slug}.md`)
        .send(post.content)
    } else {
      logUserActivity(req.prisma, { country: req.country, data: { type: 'VIEW_POST', postId: post.id } })

      return res.status(200)
        .json(post)
    }
  } else {
    return res.status(404).json({
      message: 'Post not found',
    })
  }
})

export default router