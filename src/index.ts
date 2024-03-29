import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cache } from "hono/cache"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import recognizerRouter from "@/routes/recognizer"
import authRouter from "@/routes/auth"
import { config as loadEnvironment } from "dotenv"
import SmeeClient from "smee-client"

loadEnvironment()

if (process.env.NODE_ENV === "development") {
  new SmeeClient({
    source: process.env.WEBHOOK_PROXY_URL!,
    target: process.env.WEBHOOK_LOCAL_HANDLER!,
    logger: console,
  }).start()
}

export type Env = {
  RECOGNIZER_HOST_URL: string
}

const app = new Hono<{ Bindings: Env }>({ strict: false })

app.use("*", prettyJSON())
app.use("*", cors())

if (process.env.NODE_ENV === "development") app.use("*", logger())

app.get("/", (c) =>
  c.json({
    status: "stable",
    timestamp: Date.now(),
  })
)
app.route("/recognizer", recognizerRouter)
app.route("/auth", authRouter)

app.get(
  "*",
  cache({
    cacheName: "final-masquerade-app",
    cacheControl: "max-age=7200",
    wait: true,
  })
)

const port = 3000
console.log(`Server is running on http://localhost:${port}/`)

serve({
  fetch: app.fetch,
  port,
})
