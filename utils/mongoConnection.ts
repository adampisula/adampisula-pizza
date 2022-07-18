import {
  MongoClient,
} from "https://deno.land/x/mongo@v0.30.1/mod.ts"
import { config } from "https://deno.land/x/dotenv/mod.ts"

let client: MongoClient

const connect = async () => {
  const { MONGO_CONNECTION_URL } = config()

  client = new MongoClient()
  await client.connect(MONGO_CONNECTION_URL)
}

const getDB = async () => {
  if (!client) {
    await connect()
  }

  return client.database('adampisula_pizza_db')
}

export default getDB