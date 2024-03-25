import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cache } from "hono/cache"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import recognizerRoutes from "@/routes/recognizer"
import serviceRoutes from "@/routes/services"
import { config as loadEnvironment } from "dotenv"

loadEnvironment()

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
app.route("/recognizer", recognizerRoutes)
app.route("/services", serviceRoutes)

// app.get(
//   "*",
//   cache({
//     cacheName: "final-masquerade-app",
//     cacheControl: "max-age=7200",
//   })
// )

const port = 3000
console.log(`Server is running on http://localhost:${port}/`)

serve({
  fetch: app.fetch,
  port,
})
