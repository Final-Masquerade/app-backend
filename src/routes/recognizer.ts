import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { Env } from "@/index"
import { StatusCode, SuccessStatusCode } from "hono/utils/http-status"

const recognizerRouter = new Hono<{ Bindings: Env }>()

interface RecognizeResponse {
  job_id: string
  file_type: "image/jpeg" | "image/png"
  status: "processing" | "error" | "ready"
}

recognizerRouter.post(
  "/capture",
  zValidator(
    "json",
    z.object({
      file: z.string({
        required_error: "A base64 file must be passed.",
      }),
    })
  ),
  async (c) => {
    const body = c.req.valid("json")
    const file = body.file

    const res = await fetch(
      `${process.env.RECOGNIZER_HOST_URL}/api/recognize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file }),
      }
    )

    if (!res.ok) return c.json({}, res.status as StatusCode)

    const data: RecognizeResponse = await res.json()

    return c.json(
      {
        jobId: data.job_id,
        status: data.status,
      },
      200 as SuccessStatusCode
    )
  }
)

export default recognizerRouter
