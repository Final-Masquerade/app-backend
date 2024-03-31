import { Hono } from "hono"
import { Env } from "@/index"
import { StatusCode, SuccessStatusCode } from "hono/utils/http-status"
import { captureValidator } from "@/validators/recognizerValidators"

const recognizerRouter = new Hono<{ Bindings: Env }>()

interface RecognizeResponse {
  job_id: string
  file_type: "image/jpeg" | "image/png"
  status: "processing" | "error" | "ready"
}

recognizerRouter.post("/capture", captureValidator, async (c) => {
  const body = c.req.valid("json")
  const file = body.file

  const res = await fetch(`${process.env.RECOGNIZER_HOST_URL}/api/recognize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file, user_id: body.user_id }),
  })

  if (!res.ok) return c.json({}, res.status as StatusCode)

  const data: RecognizeResponse = await res.json()

  return c.json(
    {
      jobId: data.job_id,
      status: data.status,
    },
    200 as SuccessStatusCode
  )
})

export default recognizerRouter
