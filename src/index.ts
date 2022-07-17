import { PrismaClient } from "@prisma/client"
import express from 'express'
import requestIp from 'request-ip'
import { lookup } from 'geoip-lite'
import randomString from './utils/randomString'
import bodyParser from 'body-parser'

import blogRouter from './api/blog'
import ExtendedRequest from "./types/ExtendedRequest"

const PORT = process.env.PORT || 3000
const key = process.env.KEY || randomString(32)

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(requestIp.mw())
app.use((req: ExtendedRequest, res, next) => {
  req.key = key
  req.prisma = new PrismaClient()
  req.country = 'N-A'

  if(req.clientIp && req.clientIp !== '::1' && req.clientIp !== '127.0.0.1' && req.clientIp !== '::ffff:127.0.0.1') {
    try {
      const { country } = lookup(req.clientIp)

      req.country = country
    } catch (e) {}
  }

  next()
})

app.use('/api', blogRouter)

app.listen(PORT, () => {
  console.log(`KEY: ${key}`)
  console.log(`Up and running on ${PORT}!`)
})