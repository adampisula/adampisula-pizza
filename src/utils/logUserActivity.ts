import { PrismaClient } from '@prisma/client'
import UserActivity from '../types/UserActivity'

const logUserActivity = async (prisma: PrismaClient, userActivity: UserActivity) => {
  await prisma.userActivity.create({
    data: {
      data: JSON.stringify(userActivity.data),
      country: userActivity.country,
    },
  })
}

export default logUserActivity