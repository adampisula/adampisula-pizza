import { PrismaClient } from "@prisma/client"
import { Request } from "express"

interface ExtendedRequest extends Request {
  key: string
  prisma: PrismaClient
  country: string
}

export default ExtendedRequest