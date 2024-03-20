import { serve } from "@hono/node-server"
import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import fs from "fs"
import { v4 as uuid } from "uuid"
import path from "path"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.post(
  "/capture",
  zValidator(
    "json",
    z.object({
      file: z.string({
        required_error: "A base64 file must be passed.",
      }),
    })
  ),
  (c) => {
    const body = c.req.valid("json")
    const buffer: Buffer = Buffer.from(body.file, "base64")

    const id = uuid()

    if (!fs.existsSync(path.join(process.cwd(), "temp")))
      fs.mkdirSync(path.join(process.cwd(), "temp"))

    fs.writeFileSync(path.join(process.cwd(), "temp", id + ".png"), buffer)
    console.log(`File has been saved: ${id}`)

    return c.text(`File has been saved: ${id}`)
  }
)

const port = 3000
console.log(`Server is running on http://localhost:${port}/`)

serve({
  fetch: app.fetch,
  port,
})
